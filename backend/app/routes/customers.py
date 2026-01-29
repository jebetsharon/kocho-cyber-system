from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Customer, Order

bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_customers():
    """Get all customers"""
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Customer.query
    
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                Customer.name.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
                Customer.email.ilike(search_pattern)
            )
        )
    
    # Order by last visit
    query = query.order_by(Customer.last_visit.desc().nullslast())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'customers': [customer.to_dict() for customer in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    """Get a specific customer with order history"""
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    # Get customer's recent orders
    recent_orders = Order.query.filter_by(customer_id=customer_id)\
        .order_by(Order.created_at.desc())\
        .limit(10)\
        .all()
    
    customer_data = customer.to_dict()
    customer_data['recent_orders'] = [order.to_dict() for order in recent_orders]
    
    return jsonify({'customer': customer_data}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_customer():
    """Create a new customer"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name') or not data.get('phone'):
        return jsonify({'error': 'Name and phone are required'}), 400
    
    # Check if phone already exists
    existing = Customer.query.filter_by(phone=data['phone']).first()
    if existing:
        return jsonify({'error': 'Customer with this phone number already exists'}), 409
    
    customer = Customer(
        name=data['name'],
        phone=data['phone'],
        email=data.get('email'),
        address=data.get('address'),
        account_balance=data.get('account_balance', 0.0)
    )
    
    db.session.add(customer)
    db.session.commit()
    
    return jsonify({
        'message': 'Customer created successfully',
        'customer': customer.to_dict()
    }), 201


@bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """Update a customer"""
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        customer.name = data['name']
    if 'phone' in data:
        # Check if new phone already exists for another customer
        existing = Customer.query.filter(
            Customer.phone == data['phone'],
            Customer.id != customer_id
        ).first()
        if existing:
            return jsonify({'error': 'Phone number already in use'}), 409
        customer.phone = data['phone']
    if 'email' in data:
        customer.email = data['email']
    if 'address' in data:
        customer.address = data['address']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Customer updated successfully',
        'customer': customer.to_dict()
    }), 200


@bp.route('/<int:customer_id>/balance', methods=['POST'])
@jwt_required()
def update_balance(customer_id):
    """Add or deduct from customer balance"""
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    data = request.get_json()
    
    if 'amount' not in data:
        return jsonify({'error': 'Amount is required'}), 400
    
    amount = float(data['amount'])
    operation = data.get('operation', 'add')  # add or deduct
    
    if operation == 'add':
        customer.account_balance += amount
    elif operation == 'deduct':
        if customer.account_balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        customer.account_balance -= amount
    else:
        return jsonify({'error': 'Invalid operation'}), 400
    
    db.session.commit()
    
    return jsonify({
        'message': 'Balance updated successfully',
        'customer': customer.to_dict()
    }), 200


@bp.route('/search', methods=['GET'])
@jwt_required()
def search_customers():
    """Quick search customers by phone or name"""
    query = request.args.get('q', '')
    
    if len(query) < 2:
        return jsonify({'customers': []}), 200
    
    search_pattern = f'%{query}%'
    customers = Customer.query.filter(
        db.or_(
            Customer.name.ilike(search_pattern),
            Customer.phone.ilike(search_pattern)
        )
    ).limit(10).all()
    
    return jsonify({
        'customers': [customer.to_dict() for customer in customers]
    }), 200


@bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """Delete a customer"""
    current_user_id = get_jwt_identity()
    from app.models import User
    current_user = User.query.get(current_user_id)
    
    # Only owner can delete customers
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    # Check if customer has orders
    if customer.orders:
        return jsonify({'error': 'Cannot delete customer with existing orders'}), 400
    
    db.session.delete(customer)
    db.session.commit()
    
    return jsonify({'message': 'Customer deleted successfully'}), 200