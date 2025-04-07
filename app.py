from flask import Flask, render_template, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Загружаем переменные окружения
load_dotenv()

app = Flask(__name__)
CORS(app)

# Данные о брендах и их моделях
WINDOW_BRANDS = {
    'rehau': {
        'name': 'REHAU',
        'models': [
            {'id': 'blitz', 'name': 'BLITZ', 'depth': 60},
            {'id': 'delight', 'name': 'DELIGHT', 'depth': 70},
            {'id': 'grazio', 'name': 'GRAZIO', 'depth': 70},
            {'id': 'brillant', 'name': 'BRILLANT', 'depth': 70},
            {'id': 'geneo', 'name': 'GENEO', 'depth': 86}
        ]
    },
    'kbe': {
        'name': 'KBE',
        'models': [
            {'id': 'engine', 'name': 'Engine', 'depth': 58},
            {'id': 'expert', 'name': 'Expert', 'depth': 70},
            {'id': 'expert_plus', 'name': 'Expert+', 'depth': 70}
        ]
    },
    'veka': {
        'name': 'VEKA',
        'models': [
            {'id': 'euroline', 'name': 'EUROLINE', 'depth': 58},
            {'id': 'softline', 'name': 'SOFTLINE', 'depth': 70},
            {'id': 'softline_plus', 'name': 'SOFTLINE PLUS', 'depth': 82}
        ]
    }
}

# Цвета ламинации
LAMINATION_COLORS = [
    {'id': 'white', 'name': 'Белый', 'hex': '#FFFFFF'},
    {'id': 'golden_oak', 'name': 'Золотой дуб', 'hex': '#B88A44'},
    {'id': 'mahogany', 'name': 'Махагон', 'hex': '#4A0404'},
    {'id': 'walnut', 'name': 'Орех', 'hex': '#614126'},
    {'id': 'anthracite', 'name': 'Антрацит', 'hex': '#293133'}
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/brands')
def get_brands():
    return jsonify(WINDOW_BRANDS)

@app.route('/api/lamination-colors')
def get_lamination_colors():
    return jsonify(LAMINATION_COLORS)

if __name__ == '__main__':
    app.run(debug=True)
