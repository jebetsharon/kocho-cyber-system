from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json
from app import db
from app.models import Order, OrderItem, Customer, Service, InventoryItem, Transaction, User

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

def generate_order_number():
    """Generate unique order number"""
    from datetime import datetime
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    return f'ORD-{timestamp}'


@bp.route('/', methods=['GET'])
@jwt_required()
def get_orders():
    """Get all orders"""
    status = request.args.get('status')
    customer_id = request.args.get('customer_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Order.query
    
    if status:
        query = query.filter_by(status=status)
    if customer_id:
        query = query.filter_by(customer_id=customer_id)
    if date_from:
        query = query.filter(Order.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Order.created_at <= datetime.fromisoformat(date_to))
    
    query = query.order_by(Order.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'orders': [order.to_dict() for order in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get a specific order"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify({'order': order.to_dict()}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    """Create a new order"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('items') or len(data['items']) == 0:
        return jsonify({'error': 'Order must have at least one item'}), 400
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        customer_id=data.get('customer_id'),
        user_id=current_user_id,
        total_amount=0,
        discount=data.get('discount', 0),
        final_amount=0,
        payment_method=data.get('payment_method', 'cash'),
        payment_status=data.get('payment_status', 'pending'),
        status='pending',
        notes=data.get('notes')
    )
    
    total_amount = 0
    
    # Add order items
    for item_data in data['items']:
        item_type = item_data['item_type']
        quantity = item_data.get('quantity', 1)
        unit_price = item_data['unit_price']
        total_price = quantity * unit_price
        
        order_item = OrderItem(
            item_type=item_type,
            item_id=item_data.get('item_id'),
            item_name=item_data['item_name'],
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
            specifications=json.dumps(item_data.get('specifications', {}))
        )
        
        order.items.append(order_item)
        total_amount += total_price
        
        # Update inventory if it's a product
        if item_type == 'product' and item_data.get('item_id'):
            inventory_item = InventoryItem.query.get(item_data['item_id'])
            if inventory_item:
                if inventory_item.quantity < quantity:
                    return jsonify({'error': f'Insufficient stock for {inventory_item.name}'}), 400
                inventory_item.quantity -= quantity
    
    order.total_amount = total_amount
    order.final_amount = total_amount - order.discount
    
    # Update customer if exists
    if order.customer_id:
        customer = Customer.query.get(order.customer_id)
        if customer:
            customer.last_visit = datetime.utcnow()
            customer.total_spent += order.final_amount
    
    db.session.add(order)
    db.session.commit()
    
    # Create transaction if paid
    if data.get('payment_status') == 'paid':
        transaction = Transaction(
            order_id=order.id,
            transaction_type='sale',
            amount=order.final_amount,
            payment_method=order.payment_method,
            reference_number=data.get('reference_number'),
            user_id=current_user_id
        )
        db.session.add(transaction)
        db.session.commit()
    
    return jsonify({
        'message': 'Order created successfully',
        'order': order.to_dict()
    }), 201


@bp.route('/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
    """Update an order"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    data = request.get_json()
    
    if 'status' in data:
        order.status = data['status']
        if data['status'] == 'completed':
            order.completed_at = datetime.utcnow()
    
    if 'payment_status' in data:
        old_payment_status = order.payment_status
        order.payment_status = data['payment_status']
        
        # Create transaction if payment status changed to paid
        if old_payment_status != 'paid' and data['payment_status'] == 'paid':
            current_user_id = get_jwt_identity()
            transaction = Transaction(
                order_id=order.id,
                transaction_type='sale',
                amount=order.final_amount,
                payment_method=order.payment_method,
                reference_number=data.get('reference_number'),
                user_id=current_user_id
            )
            db.session.add(transaction)
    
    if 'notes' in data:
        order.notes = data['notes']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Order updated successfully',
        'order': order.to_dict()
    }), 200


@bp.route('/<int:order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if order.status == 'completed':
        return jsonify({'error': 'Cannot cancel completed order'}), 400
    
    # Restore inventory for product items
    for item in order.items:
        if item.item_type == 'product' and item.item_id:
            inventory_item = InventoryItem.query.get(item.item_id)
            if inventory_item:
                inventory_item.quantity += item.quantity
    
    order.status = 'cancelled'
    db.session.commit()
    
    return jsonify({
        'message': 'Order cancelled successfully',
        'order': order.to_dict()
    }), 200


@bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_orders():
    """Get today's orders"""
    from datetime import date
    today = date.today()
    
    orders = Order.query.filter(
        db.func.date(Order.created_at) == today
    ).order_by(Order.created_at.desc()).all()
    
    total_sales = sum(order.final_amount for order in orders if order.payment_status == 'paid')
    
    return jsonify({
        'orders': [order.to_dict() for order in orders],
        'count': len(orders),
        'total_sales': total_sales
    }), 200


@bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_orders():
    """Get recent orders"""
    limit = request.args.get('limit', 10, type=int)
    
    orders = Order.query.order_by(Order.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'orders': [order.to_dict() for order in orders]
    }), 200


@bp.route('/<int:order_id>/receipt', methods=['GET'])
@jwt_required()
def get_receipt(order_id):
    """Generate receipt data for an order"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    from config import Config
    
    receipt_data = {
        'business': {
            'name': Config.BUSINESS_NAME,
            'email': Config.BUSINESS_EMAIL,
            'phone': Config.BUSINESS_PHONE,
            'address': Config.BUSINESS_ADDRESS
        },
        'order': order.to_dict(),
        'generated_at': datetime.utcnow().isoformat()
    }
    
    return jsonify({'receipt': receipt_data}), 200