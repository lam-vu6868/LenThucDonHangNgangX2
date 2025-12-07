from flask import Blueprint, send_from_directory
import os

main_bp = Blueprint('main', __name__)

# Serve frontend files
@main_bp.route('/')
def index():
    frontend_dir = os.path.abspath('../frontend')
    return send_from_directory(frontend_dir, 'index.html')

@main_bp.route('/<path:filename>')
def serve_static(filename):
    frontend_dir = os.path.abspath('../frontend')
    return send_from_directory(frontend_dir, filename)
