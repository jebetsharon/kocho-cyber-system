from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Expense, User

bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_expenses():
    """Get all expenses"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can view expenses
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    category = request.args.get('category')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Expense.query
    
    if category:
        query = query.filter_by(category=category)
    if date_from:
        query = query.filter(Expense.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Expense.created_at <= datetime.fromisoformat(date_to))
    
    query = query.order_by(Expense.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'expenses': [expense.to_dict() for expense in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_expense(expense_id):
    """Get a specific expense"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    return jsonify({'expense': expense.to_dict()}), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_expense():
    """Create a new expense"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can create expenses
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['category', 'description', 'amount', 'payment_method']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    expense = Expense(
        category=data['category'],
        description=data['description'],
        amount=data['amount'],
        payment_method=data['payment_method'],
        receipt_number=data.get('receipt_number'),
        user_id=current_user_id
    )
    
    db.session.add(expense)
    db.session.commit()
    
    return jsonify({
        'message': 'Expense created successfully',
        'expense': expense.to_dict()
    }), 201


@bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update an expense"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    data = request.get_json()
    
    if 'category' in data:
        expense.category = data['category']
    if 'description' in data:
        expense.description = data['description']
    if 'amount' in data:
        expense.amount = data['amount']
    if 'payment_method' in data:
        expense.payment_method = data['payment_method']
    if 'receipt_number' in data:
        expense.receipt_number = data['receipt_number']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Expense updated successfully',
        'expense': expense.to_dict()
    }), 200


@bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    db.session.delete(expense)
    db.session.commit()
    
    return jsonify({'message': 'Expense deleted successfully'}), 200


@bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all expense categories"""
    categories = [
        {'value': 'rent', 'label': 'Rent'},
        {'value': 'utilities', 'label': 'Utilities (Electricity, Water, Internet)'},
        {'value': 'supplies', 'label': 'Office Supplies'},
        {'value': 'salary', 'label': 'Salaries & Wages'},
        {'value': 'maintenance', 'label': 'Maintenance & Repairs'},
        {'value': 'equipment', 'label': 'Equipment Purchase'},
        {'value': 'marketing', 'label': 'Marketing & Advertising'},
        {'value': 'transport', 'label': 'Transport & Fuel'},
        {'value': 'other', 'label': 'Other Expenses'}
    ]
    return jsonify({'categories': categories}), 200