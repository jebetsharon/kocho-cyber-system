from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Service, User

bp = Blueprint('services', __name__, url_prefix='/api/services')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_services():
    """Get all services"""
    category = request.args.get('category')
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    
    query = Service.query
    
    if category:
        query = query.filter_by(category=category)
    if active_only:
        query = query.filter_by(is_active=True)
    
    services = query.all()
    return jsonify({'services': [service.to_dict() for service in services]}), 200


@bp.route('/<int:service_id>', methods=['GET'])
@jwt_required()
def get_service(service_id):
    """Get a specific service"""
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    
    return jsonify({'service': service.to_dict()}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_service():
    """Create a new service"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can create services
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'category', 'base_price', 'unit']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    service = Service(
        name=data['name'],
        category=data['category'],
        description=data.get('description'),
        base_price=data['base_price'],
        unit=data['unit'],
        is_active=data.get('is_active', True)
    )
    
    db.session.add(service)
    db.session.commit()
    
    return jsonify({
        'message': 'Service created successfully',
        'service': service.to_dict()
    }), 201


@bp.route('/<int:service_id>', methods=['PUT'])
@jwt_required()
def update_service(service_id):
    """Update a service"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can update services
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        service.name = data['name']
    if 'category' in data:
        service.category = data['category']
    if 'description' in data:
        service.description = data['description']
    if 'base_price' in data:
        service.base_price = data['base_price']
    if 'unit' in data:
        service.unit = data['unit']
    if 'is_active' in data:
        service.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Service updated successfully',
        'service': service.to_dict()
    }), 200


@bp.route('/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id):
    """Delete a service"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can delete services
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    
    # Soft delete by deactivating
    service.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Service deactivated successfully'}), 200


@bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all service categories"""
    categories = [
        {'value': 'printing', 'label': 'Printing Services'},
        {'value': 'scanning', 'label': 'Scanning & Photocopying'},
        {'value': 'graphic_design', 'label': 'Graphic Design'},
        {'value': 'web_development', 'label': 'Web Development'},
        {'value': 'cctv', 'label': 'CCTV Installation'},
        {'value': 'general_supplies', 'label': 'General Supplies'},
        {'value': 'other', 'label': 'Other Services'}
    ]
    return jsonify({'categories': categories}), 200