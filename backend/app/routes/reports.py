from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
from sqlalchemy import func, and_, extract
from app import db
from app.models import Order, OrderItem, Transaction, Expense, Customer, Service, InventoryItem, User

bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    today = date.today()
    
    # Today's sales
    today_orders = Order.query.filter(
        func.date(Order.created_at) == today,
        Order.payment_status == 'paid'
    ).all()
    today_sales = sum(order.final_amount for order in today_orders)
    
    # This month's sales
    month_start = today.replace(day=1)
    month_orders = Order.query.filter(
        Order.created_at >= month_start,
        Order.payment_status == 'paid'
    ).all()
    month_sales = sum(order.final_amount for order in month_orders)
    
    # Total customers
    total_customers = Customer.query.count()
    
    # New customers this month
    new_customers = Customer.query.filter(
        Customer.created_at >= month_start
    ).count()
    
    # Pending orders
    pending_orders = Order.query.filter_by(status='pending').count()
    
    # Low stock items
    all_items = InventoryItem.query.all()
    low_stock_count = len([item for item in all_items if item.is_low_stock])
    
    # Recent orders
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()
    
    # Top services this month
    top_services_data = db.session.query(
        OrderItem.item_name,
        func.sum(OrderItem.quantity).label('total_quantity'),
        func.sum(OrderItem.total_price).label('total_revenue')
    ).join(Order).filter(
        Order.created_at >= month_start,
        OrderItem.item_type == 'service'
    ).group_by(OrderItem.item_name).order_by(func.sum(OrderItem.total_price).desc()).limit(5).all()
    
    top_services = [
        {
            'name': item[0],
            'quantity': int(item[1]),
            'revenue': float(item[2])
        }
        for item in top_services_data
    ]
    
    return jsonify({
        'today_sales': today_sales,
        'today_orders': len(today_orders),
        'month_sales': month_sales,
        'month_orders': len(month_orders),
        'total_customers': total_customers,
        'new_customers': new_customers,
        'pending_orders': pending_orders,
        'low_stock_count': low_stock_count,
        'recent_orders': [order.to_dict() for order in recent_orders],
        'top_services': top_services
    }), 200


@bp.route('/sales', methods=['GET'])
@jwt_required()
def get_sales_report():
    """Get sales report for a date range"""
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    if not date_from or not date_to:
        return jsonify({'error': 'date_from and date_to are required'}), 400
    
    try:
        start_date = datetime.fromisoformat(date_from)
        end_date = datetime.fromisoformat(date_to)
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    # Get orders in date range
    orders = Order.query.filter(
        and_(
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.payment_status == 'paid'
        )
    ).all()
    
    total_sales = sum(order.final_amount for order in orders)
    total_orders = len(orders)
    
    # Group by payment method
    payment_methods = db.session.query(
        Order.payment_method,
        func.count(Order.id).label('count'),
        func.sum(Order.final_amount).label('total')
    ).filter(
        and_(
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.payment_status == 'paid'
        )
    ).group_by(Order.payment_method).all()
    
    payment_breakdown = [
        {
            'method': item[0],
            'count': item[1],
            'total': float(item[2] or 0)
        }
        for item in payment_methods
    ]
    
    # Daily sales
    daily_sales = db.session.query(
        func.date(Order.created_at).label('date'),
        func.count(Order.id).label('orders'),
        func.sum(Order.final_amount).label('sales')
    ).filter(
        and_(
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.payment_status == 'paid'
        )
    ).group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at)).all()
    
    daily_breakdown = [
        {
            'date': item[0].isoformat(),
            'orders': item[1],
            'sales': float(item[2] or 0)
        }
        for item in daily_sales
    ]
    
    return jsonify({
        'period': {
            'from': date_from,
            'to': date_to
        },
        'total_sales': total_sales,
        'total_orders': total_orders,
        'average_order': total_sales / total_orders if total_orders > 0 else 0,
        'payment_breakdown': payment_breakdown,
        'daily_breakdown': daily_breakdown
    }), 200


@bp.route('/services', methods=['GET'])
@jwt_required()
def get_services_report():
    """Get services performance report"""
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = db.session.query(
        OrderItem.item_name,
        OrderItem.item_type,
        func.count(OrderItem.id).label('count'),
        func.sum(OrderItem.quantity).label('quantity'),
        func.sum(OrderItem.total_price).label('revenue')
    ).join(Order)
    
    if date_from and date_to:
        start_date = datetime.fromisoformat(date_from)
        end_date = datetime.fromisoformat(date_to)
        query = query.filter(
            and_(
                Order.created_at >= start_date,
                Order.created_at <= end_date,
                Order.payment_status == 'paid'
            )
        )
    
    services_data = query.filter(
        OrderItem.item_type == 'service'
    ).group_by(OrderItem.item_name, OrderItem.item_type).order_by(
        func.sum(OrderItem.total_price).desc()
    ).all()
    
    services = [
        {
            'name': item[0],
            'type': item[1],
            'count': item[2],
            'quantity': int(item[3]),
            'revenue': float(item[4])
        }
        for item in services_data
    ]
    
    total_revenue = sum(s['revenue'] for s in services)
    
    return jsonify({
        'services': services,
        'total_revenue': total_revenue,
        'total_transactions': len(services)
    }), 200


@bp.route('/inventory', methods=['GET'])
@jwt_required()
def get_inventory_report():
    """Get inventory report"""
    items = InventoryItem.query.all()
    
    total_value = sum(item.quantity * item.unit_price for item in items)
    total_potential = sum(item.quantity * item.selling_price for item in items)
    low_stock_items = [item for item in items if item.is_low_stock]
    
    # Category breakdown
    category_data = {}
    for item in items:
        if item.category not in category_data:
            category_data[item.category] = {
                'items': 0,
                'quantity': 0,
                'value': 0
            }
        category_data[item.category]['items'] += 1
        category_data[item.category]['quantity'] += item.quantity
        category_data[item.category]['value'] += item.quantity * item.unit_price
    
    return jsonify({
        'total_items': len(items),
        'total_value': total_value,
        'total_potential': total_potential,
        'low_stock_count': len(low_stock_items),
        'low_stock_items': [item.to_dict() for item in low_stock_items],
        'category_breakdown': category_data
    }), 200


@bp.route('/customers', methods=['GET'])
@jwt_required()
def get_customers_report():
    """Get customers report"""
    # Top customers by spending
    top_customers = Customer.query.order_by(Customer.total_spent.desc()).limit(10).all()
    
    # Recent customers
    recent_customers = Customer.query.order_by(Customer.created_at.desc()).limit(10).all()
    
    # Customers with account balance
    customers_with_balance = Customer.query.filter(Customer.account_balance > 0).all()
    total_balance = sum(c.account_balance for c in customers_with_balance)
    
    return jsonify({
        'total_customers': Customer.query.count(),
        'top_customers': [c.to_dict() for c in top_customers],
        'recent_customers': [c.to_dict() for c in recent_customers],
        'customers_with_balance': len(customers_with_balance),
        'total_customer_balance': total_balance
    }), 200


@bp.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses_report():
    """Get expenses report"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can view expenses
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = Expense.query
    
    if date_from and date_to:
        start_date = datetime.fromisoformat(date_from)
        end_date = datetime.fromisoformat(date_to)
        query = query.filter(
            and_(
                Expense.created_at >= start_date,
                Expense.created_at <= end_date
            )
        )
    
    expenses = query.all()
    total_expenses = sum(e.amount for e in expenses)
    
    # Category breakdown
    category_breakdown = db.session.query(
        Expense.category,
        func.count(Expense.id).label('count'),
        func.sum(Expense.amount).label('total')
    )
    
    if date_from and date_to:
        category_breakdown = category_breakdown.filter(
            and_(
                Expense.created_at >= start_date,
                Expense.created_at <= end_date
            )
        )
    
    category_data = category_breakdown.group_by(Expense.category).all()
    
    categories = [
        {
            'category': item[0],
            'count': item[1],
            'total': float(item[2])
        }
        for item in category_data
    ]
    
    return jsonify({
        'total_expenses': total_expenses,
        'expenses_count': len(expenses),
        'category_breakdown': categories,
        'expenses': [e.to_dict() for e in expenses]
    }), 200


@bp.route('/profit-loss', methods=['GET'])
@jwt_required()
def get_profit_loss():
    """Get profit and loss report"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only owner can view P&L
    if current_user.role != 'owner':
        return jsonify({'error': 'Unauthorized'}), 403
    
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    if not date_from or not date_to:
        return jsonify({'error': 'date_from and date_to are required'}), 400
    
    start_date = datetime.fromisoformat(date_from)
    end_date = datetime.fromisoformat(date_to)
    
    # Revenue
    revenue_orders = Order.query.filter(
        and_(
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.payment_status == 'paid'
        )
    ).all()
    total_revenue = sum(order.final_amount for order in revenue_orders)
    
    # Expenses
    expenses = Expense.query.filter(
        and_(
            Expense.created_at >= start_date,
            Expense.created_at <= end_date
        )
    ).all()
    total_expenses = sum(e.amount for e in expenses)
    
    # Net profit
    net_profit = total_revenue - total_expenses
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    return jsonify({
        'period': {
            'from': date_from,
            'to': date_to
        },
        'revenue': total_revenue,
        'expenses': total_expenses,
        'net_profit': net_profit,
        'profit_margin': profit_margin
    }), 200