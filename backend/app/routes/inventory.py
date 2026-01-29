from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import InventoryItem, User

bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_inventory():
    """Get all inventory items"""
    category = request.args.get('category')
    low_stock = request.args.get('low_stock', 'false').lower() == 'true'
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    query = InventoryItem.query
    
    if category:
        query = query.filter_by(category=category)
    
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                InventoryItem.name.ilike(search_pattern),
                InventoryItem.sku.ilike(search_pattern)
            )
        )
    
    # Get all items first if we need to filter low stock
    if low_stock:
        all_items = query.all()
        low_stock_items = [item for item in all_items if item.is_low_stock]
        return jsonify({
            'items': [item.to_dict() for item in low_stock_items],
            'total': len(low_stock_items)
        }), 200
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'items': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock():
    """Get all low stock items"""
    items = InventoryItem.query.all()
    low_stock_items = [item for item in items if item.is_low_stock]
    
    return jsonify({
        'items': [item.to_dict() for item in low_stock_items],
        'count': len(low_stock_items)
    }), 200


@bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_item(item_id):
    """Get a specific inventory item"""
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    return jsonify({'item': item.to_dict()}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_item():
    """Create a new inventory item"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can create inventory items
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'category', 'unit_price', 'selling_price']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if SKU already exists
    if data.get('sku'):
        existing = InventoryItem.query.filter_by(sku=data['sku']).first()
        if existing:
            return jsonify({'error': 'SKU already exists'}), 409
    
    item = InventoryItem(
        name=data['name'],
        category=data['category'],
        sku=data.get('sku'),
        quantity=data.get('quantity', 0),
        min_quantity=data.get('min_quantity', 10),
        unit_price=data['unit_price'],
        selling_price=data['selling_price'],
        supplier=data.get('supplier')
    )
    
    db.session.add(item)
    db.session.commit()
    
    return jsonify({
        'message': 'Item created successfully',
        'item': item.to_dict()
    }), 201


@bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    """Update an inventory item"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can update inventory
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        item.name = data['name']
    if 'category' in data:
        item.category = data['category']
    if 'sku' in data:
        # Check if new SKU already exists
        existing = InventoryItem.query.filter(
            InventoryItem.sku == data['sku'],
            InventoryItem.id != item_id
        ).first()
        if existing:
            return jsonify({'error': 'SKU already exists'}), 409
        item.sku = data['sku']
    if 'quantity' in data:
        item.quantity = data['quantity']
    if 'min_quantity' in data:
        item.min_quantity = data['min_quantity']
    if 'unit_price' in data:
        item.unit_price = data['unit_price']
    if 'selling_price' in data:
        item.selling_price = data['selling_price']
    if 'supplier' in data:
        item.supplier = data['supplier']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Item updated successfully',
        'item': item.to_dict()
    }), 200


@bp.route('/<int:item_id>/stock', methods=['POST'])
@jwt_required()
def adjust_stock(item_id):
    """Adjust stock quantity (add or remove)"""
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    data = request.get_json()
    
    if 'quantity' not in data or 'operation' not in data:
        return jsonify({'error': 'Quantity and operation are required'}), 400
    
    quantity = int(data['quantity'])
    operation = data['operation']  # add or remove
    
    if operation == 'add':
        item.quantity += quantity
    elif operation == 'remove':
        if item.quantity < quantity:
            return jsonify({'error': 'Insufficient stock'}), 400
        item.quantity -= quantity
    else:
        return jsonify({'error': 'Invalid operation'}), 400
    
    db.session.commit()
    
    return jsonify({
        'message': 'Stock adjusted successfully',
        'item': item.to_dict()
    }), 200


@bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    """Delete an inventory item"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can delete inventory
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': 'Item deleted successfully'}), 200


@bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all inventory categories"""
    categories = [
        {'value': 'stationery', 'label': 'Stationery'},
        {'value': 'supplies', 'label': 'Office Supplies'},
        {'value': 'equipment', 'label': 'Equipment'},
        {'value': 'consumables', 'label': 'Consumables'},
        {'value': 'other', 'label': 'Other'}
    ]
    return jsonify({'categories': categories}), 200