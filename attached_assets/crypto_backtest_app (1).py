import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import base64
from io import BytesIO
from PIL import Image
import bcrypt
import sqlite3
from streamlit_option_menu import option_menu
import random
import string
import yfinance as yf
from ta.trend import MACD
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands
import logging
import os
import shutil
import schedule
import time
import threading
import requests

# Set up logging
logging.basicConfig(level=logging.DEBUG, filename='app.log', filemode='a',
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Page configuration
st.set_page_config(page_title="Crypto Backtest System", layout="wide", initial_sidebar_state="collapsed")

# Custom CSS for improved design
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(to right, #1a1a2e, #16213e, #0f3460);
        color: #e0e0e0;
    }
    .stButton>button {
        background-color: #4a4e69;
        color: #ffffff;
        border: none;
        border-radius: 5px;
        padding: 0.5rem 1rem;
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background-color: #22223b;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stTextInput>div>div>input {
        background-color: #2d2d2d;
        color: #ffffff;
        border: 1px solid #4a4e69;
        border-radius: 5px;
    }
    .stSelectbox>div>div>select {
        background-color: #2d2d2d;
        color: #ffffff;
        border: 1px solid #4a4e69;
        border-radius: 5px;
    }
    .stDataFrame {
        background-color: #2d2d2d;
    }
    .stPlotlyChart {
        background-color: #2d2d2d;
        border-radius: 10px;
        padding: 1rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stExpander {
        background-color: #2d2d2d;
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    .user-avatar {
        border-radius: 50%;
        border: 2px solid #4a4e69;
        width: 100px;
        height: 100px;
        object-fit: cover;
    }
    .user-level {
        font-size: 2rem;
        font-weight: bold;
        color: #fca311;
        margin-top: 0.5rem;
        text-align: center;
        padding: 10px;
        background: rgba(0,0,0,0.5);
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .dashboard-card {
        background-color: #22223b;
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .dashboard-metric {
        font-size: 2rem;
        font-weight: bold;
        color: #fca311;
    }
    @keyframes fadeIn {
        from {opacity: 0;}
        to {opacity: 1;}
    }
    .fade-in {
        animation: fadeIn 0.5s ease-in;
    }
    .crypto-news {
        background-color: #2d2d2d;
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }
    .crypto-news:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.2);
    }
    .crypto-news h3 {
        color: #fca311;
        margin-bottom: 0.5rem;
    }
    .crypto-news p {
        color: #e0e0e0;
        margin-bottom: 0.5rem;
    }
    .crypto-news a {
        color: #4a4e69;
        text-decoration: none;
        font-weight: bold;
    }
    .market-overview {
        background-color: #2d2d2d;
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    .market-overview h3 {
        color: #fca311;
    }
</style>
""", unsafe_allow_html=True)

# Database connection
@st.cache_resource
def get_database_connection():
    conn = sqlite3.connect('crypto_backtest.db', check_same_thread=False)
    return conn

conn = get_database_connection()
c = conn.cursor()

# Create tables and add new columns if not exists
def setup_database():
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  is_admin INTEGER DEFAULT 0,
                  expiry_date TEXT,
                  level INTEGER DEFAULT 1,
                  profile_picture BLOB,
                  bio TEXT,
                  risk_tolerance TEXT)''')

    c.execute('''CREATE TABLE IF NOT EXISTS trades
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER,
                  date TEXT,
                  end_date TEXT,
                  pair TEXT,
                  amount REAL,
                  entry_price REAL,
                  exit_price REAL,
                  strategy TEXT,
                  notes TEXT,
                  entry_screenshot TEXT,
                  exit_screenshot TEXT,
                  status TEXT,
                  trade_type TEXT,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')

    c.execute('''CREATE TABLE IF NOT EXISTS registration_code
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  code TEXT,
                  date TEXT)''')

    c.execute('''CREATE TABLE IF NOT EXISTS analysis_types
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL)''')

    c.execute('''CREATE TABLE IF NOT EXISTS trading_pairs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  pair TEXT UNIQUE NOT NULL)''')

    # Add new columns if they don't exist
    c.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in c.fetchall()]
    if 'bio' not in columns:
        c.execute("ALTER TABLE users ADD COLUMN bio TEXT")
    if 'risk_tolerance' not in columns:
        c.execute("ALTER TABLE users ADD COLUMN risk_tolerance TEXT")
    
    c.execute("PRAGMA table_info(trades)")
    columns = [column[1] for column in c.fetchall()]
    if 'trade_type' not in columns:
        c.execute("ALTER TABLE trades ADD COLUMN trade_type TEXT")

    conn.commit()

setup_database()

# Helper functions for users
def create_user(username, password, is_admin=0):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    expiry_date = (datetime.now() + timedelta(days=30)).isoformat()
    c.execute("INSERT INTO users (username, password, is_admin, expiry_date, level) VALUES (?, ?, ?, ?, ?)",
              (username, hashed_password, is_admin, expiry_date, 1))
    conn.commit()

def verify_user(username, password):
    c.execute("SELECT * FROM users WHERE username=?", (username,))
    user = c.fetchone()
    if user and bcrypt.checkpw(password.encode('utf-8'), user[2]):
        return user
    return None

def is_user_expired(username):
    c.execute("SELECT expiry_date FROM users WHERE username=?", (username,))
    expiry_date = c.fetchone()[0]
    return datetime.fromisoformat(expiry_date) < datetime.now()

def update_user_expiry(username, new_expiry_date):
    c.execute("UPDATE users SET expiry_date=? WHERE username=?", (new_expiry_date, username))
    conn.commit()

def delete_user(username):
    c.execute("DELETE FROM users WHERE username=?", (username,))
    conn.commit()

def update_user_level(user_id):
    c.execute("SELECT COUNT(*) FROM trades WHERE user_id=?", (user_id,))
    trade_count = c.fetchone()[0]
    new_level = min(10, trade_count // 10 + 1)  # Max level is 10
    c.execute("UPDATE users SET level=? WHERE id=?", (new_level, user_id))
    conn.commit()

def update_profile_picture(user_id, image):
    image_bytes = image.getvalue()
    c.execute("UPDATE users SET profile_picture=? WHERE id=?", (image_bytes, user_id))
    conn.commit()

def update_user_bio(user_id, bio):
    c.execute("UPDATE users SET bio=? WHERE id=?", (bio, user_id))
    conn.commit()

def update_user_risk_tolerance(user_id, risk_tolerance):
    c.execute("UPDATE users SET risk_tolerance=? WHERE id=?", (risk_tolerance, user_id))
    conn.commit()

# Helper functions for trades
@st.cache_data(ttl=60)
def load_user_trades(user_id):
    c.execute("SELECT * FROM trades WHERE user_id=?", (user_id,))
    return c.fetchall()

def save_trade(user_id, trade_data):
    try:
        c.execute('''INSERT INTO trades 
                     (user_id, date, end_date, pair, amount, entry_price, exit_price, strategy, notes, entry_screenshot, exit_screenshot, status, trade_type) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (user_id, trade_data['date'], trade_data['end_date'], trade_data['pair'], trade_data['amount'],
                   trade_data['entry_price'], trade_data['exit_price'], trade_data['strategy'],
                   trade_data['notes'], trade_data.get('entry_screenshot'), trade_data.get('exit_screenshot'),
                   trade_data['status'], trade_data['trade_type']))
        conn.commit()
        update_user_level(user_id)
        return True, "Trade saved successfully"
    except sqlite3.Error as e:
        conn.rollback()
        logger.error(f"Database error when saving trade: {str(e)}")
        return False, f"Database error: {str(e)}"
    except Exception as e:
        conn.rollback()
        logger.error(f"Error saving trade: {str(e)}")
        return False, f"Error saving trade: {str(e)}"

def update_trade(trade_id, trade_data):
    try:
        c.execute('''UPDATE trades 
                     SET date=?, end_date=?, pair=?, amount=?, entry_price=?, exit_price=?, strategy=?, notes=?, 
                     entry_screenshot=?, exit_screenshot=?, status=?, trade_type=?
                     WHERE id=?''',
                  (trade_data['date'], trade_data['end_date'], trade_data['pair'], trade_data['amount'],
                   trade_data['entry_price'], trade_data['exit_price'], trade_data['strategy'],
                   trade_data['notes'], trade_data.get('entry_screenshot'), trade_data.get('exit_screenshot'),
                   trade_data['status'], trade_data['trade_type'], trade_id))
        
        conn.commit()
        logger.info(f"Trade {trade_id} updated successfully")
        return True, "Trade updated successfully"
    except sqlite3.Error as e:
        conn.rollback()
        logger.error(f"Database error when updating trade {trade_id}: {str(e)}")
        return False, f"Database error: {str(e)}"
    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating trade {trade_id}: {str(e)}")
        return False, f"Error updating trade: {str(e)}"

def delete_trade(trade_id):
    try:
        c.execute("DELETE FROM trades WHERE id=?", (trade_id,))
        conn.commit()
        logger.info(f"Trade {trade_id} deleted successfully")
        return True, "Trade deleted successfully"
    except sqlite3.Error as e:
        conn.rollback()
        logger.error(f"Database error when deleting trade {trade_id}: {str(e)}")
        return False, f"Database error: {str(e)}"
    except Exception as e:
        conn.rollback()
        logger.error(f"Error deleting trade {trade_id}: {str(e)}")
        return False, f"Error deleting trade: {str(e)}"

# Analysis functions
def get_total_profit_loss(trades):
    total_pnl = 0
    for trade in trades:
        if trade[7] is not None and trade[6] is not None:  # exit_price and entry_price
            amount = float(trade[5])
            entry_price = float(trade[6])
            exit_price = float(trade[7])
            trade_type = trade[13]  # Assuming trade_type is at index 13
            
            if trade_type == 'long':
                pnl = (exit_price - entry_price) * amount
            elif trade_type == 'short':
                pnl = (entry_price - exit_price) * amount
            else:
                pnl = 0  # Invalid trade type
            
            total_pnl += pnl
    return total_pnl

def get_win_rate(trades):
    completed_trades = [trade for trade in trades if trade[7] is not None]
    if not completed_trades:
        return 0
    winning_trades = sum(1 for trade in completed_trades 
                         if (float(trade[7]) > float(trade[6]) and trade[13] == 'long') or
                            (float(trade[7]) < float(trade[6]) and trade[13] == 'short'))
    return winning_trades / len(completed_trades)

def get_average_profit_loss(trades):
    completed_trades = [trade for trade in trades if trade[7] is not None]
    if not completed_trades:
        return 0
    total_pnl = get_total_profit_loss(completed_trades)
    return total_pnl / len(completed_trades)

def get_sharpe_ratio(trades):
    completed_trades = [trade for trade in trades if trade[7] is not None]
    if not completed_trades:
        return 0
    returns = []
    for trade in completed_trades:
        entry_price = float(trade[6])
        exit_price = float(trade[7])
        trade_type = trade[13]
        
        if trade_type == 'long':
            returns.append((exit_price - entry_price) / entry_price)
        elif trade_type == 'short':
            returns.append((entry_price - exit_price) / entry_price)
    
    if not returns:
        return 0
    
    return np.mean(returns) / np.std(returns) if np.std(returns) != 0 else 0

def get_max_drawdown(trades):
    completed_trades = [trade for trade in trades if trade[7] is not None]
    if not completed_trades:
        return 0
    cumulative = np.cumsum([get_trade_profit_loss(trade) for trade in completed_trades])
    peak = np.maximum.accumulate(cumulative)
    drawdown = (peak - cumulative) / peak
    return np.max(drawdown)

def calculate_risk_reward_ratio(trade):
    try:
        if trade[7] is None or trade[6] is None:
            return None
        entry_price = float(trade[6])
        exit_price = float(trade[7])
        trade_type = trade[13]
        
        if trade_type == 'long':
            risk = abs(entry_price - (entry_price * 0.99))  # Assuming 1% stop loss
            reward = abs(exit_price - entry_price)
        elif trade_type == 'short':
            risk = abs((entry_price * 1.01) - entry_price)  # Assuming 1% stop loss
            reward = abs(entry_price - exit_price)
        else:
            return None
        
        return reward / risk if risk != 0 else 0
    except ValueError:
        return None

def get_average_trade_duration(trades):
    completed_trades = [trade for trade in trades if trade[3] is not None]  # end_date is not None
    if not completed_trades:
        return timedelta(0)
    durations = [(datetime.fromisoformat(trade[3]) - datetime.fromisoformat(trade[2])) for trade in completed_trades]
    return sum(durations, timedelta(0)) / len(durations)

def get_trade_profit_loss(trade):
    if trade[7] is not None and trade[6] is not None:  # exit_price and entry_price
        amount = float(trade[5])
        entry_price = float(trade[6])
        exit_price = float(trade[7])
        trade_type = trade[13]
        
        if trade_type == 'long':
            return (exit_price - entry_price) * amount
        elif trade_type == 'short':
            return (entry_price - exit_price) * amount
    return 0

def calculate_profit_loss_percentage(trade):
    if trade[7] is not None and trade[6] is not None:  # exit_price and entry_price
        entry_price = float(trade[6])
        exit_price = float(trade[7])
        trade_type = trade[13]
        
        if trade_type == 'long':
            return ((exit_price - entry_price) / entry_price) * 100
        elif trade_type == 'short':
            return ((entry_price - exit_price) / entry_price) * 100
    return 0

# Registration code functions
def generate_registration_code():
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    date = datetime.now().date().isoformat()
    c.execute("INSERT INTO registration_code (code, date) VALUES (?, ?)", (code, date))
    conn.commit()
    return code

def get_current_registration_code():
    today = datetime.now().date().isoformat()
    c.execute("SELECT code FROM registration_code WHERE date = ? ORDER BY id DESC LIMIT 1", (today,))
    result = c.fetchone()
    if result:
        return result[0]
    else:
        return generate_registration_code()

def verify_registration_code(code):
    today = datetime.now().date().isoformat()
    c.execute("SELECT * FROM registration_code WHERE code = ? AND date = ?", (code, today))
    return c.fetchone() is not None

# Analysis type and trading pair functions
def get_analysis_types():
    c.execute("SELECT name FROM analysis_types")
    return [row[0] for row in c.fetchall()]

def get_trading_pairs():
    c.execute("SELECT pair FROM trading_pairs")
    return [row[0] for row in c.fetchall()]

def add_analysis_type(name):
    try:
        c.execute("INSERT INTO analysis_types (name) VALUES (?)", (name,))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False

def delete_analysis_type(name):
    c.execute("DELETE FROM analysis_types WHERE name=?", (name,))
    conn.commit()

def add_trading_pair(pair):
    try:
        c.execute("INSERT INTO trading_pairs (pair) VALUES (?)", (pair,))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False

def delete_trading_pair(pair):
    c.execute("DELETE FROM trading_pairs WHERE pair=?", (pair,))
    conn.commit()

# Top Traders functions
@st.cache_data(ttl=60)
def get_top_traders(limit=10):
    c.execute('''
        SELECT u.username, COUNT(*) as total_trades, 
               SUM(CASE WHEN t.exit_price > t.entry_price AND t.trade_type = 'long' OR
                         t.exit_price < t.entry_price AND t.trade_type = 'short' THEN 1 ELSE 0 END) as winning_trades,
               u.level
        FROM users u
        JOIN trades t ON u.id = t.user_id
        WHERE t.exit_price IS NOT NULL
        GROUP BY u.id
        ORDER BY (CAST(winning_trades AS FLOAT) / CAST(total_trades AS FLOAT)) DESC
        LIMIT ?
    ''', (limit,))
    return c.fetchall()

# New function for real-time market data
def get_real_time_data(symbol):
    ticker = yf.Ticker(symbol)
    data = ticker.history(period="1d")
    return data.iloc[-1]['Close']

# New function for technical analysis
def perform_technical_analysis(symbol):
    data = yf.download(symbol, start="2022-01-01", end=datetime.now().strftime("%Y-%m-%d"))
    
    # Calculate MACD
    macd = MACD(close=data['Close'])
    data['MACD'] = macd.macd()
    data['Signal'] = macd.macd_signal()
    
    # Calculate RSI
    rsi = RSIIndicator(close=data['Close'])
    data['RSI'] = rsi.rsi()
    
    # Calculate Bollinger Bands
    bb = BollingerBands(close=data['Close'])
    data['BB_high'] = bb.bollinger_hband()
    data['BB_low'] = bb.bollinger_lband()
    
    return data

# Backup functions
def create_backup():
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"backup_{timestamp}.db")
    
    shutil.copy2('crypto_backtest.db', backup_file)
    logger.info(f"Backup created: {backup_file}")
    return backup_file

def schedule_backup():
    schedule.every().day.at("13:00").do(create_backup)

def run_schedule():
    while True:
        schedule.run_pending()
        time.sleep(60)

# Start the backup scheduler in a separate thread
backup_thread = threading.Thread(target=run_schedule)
backup_thread.start()

def get_last_backup_time():
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        return None
    
    backup_files = [f for f in os.listdir(backup_dir) if f.startswith("backup_") and f.endswith(".db")]
    if not backup_files:
        return None
    
    latest_backup = max(backup_files, key=lambda x: os.path.getctime(os.path.join(backup_dir, x)))
    return datetime.fromtimestamp(os.path.getctime(os.path.join(backup_dir, latest_backup)))

# Function to fetch latest crypto news
def get_crypto_news():
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": "cryptocurrency",
        "apiKey": "YOUR_NEWS_API_KEY",  # Replace with your actual News API key
        "pageSize": 5,
        "sortBy": "publishedAt"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        news = response.json()['articles']
        return [{'title': item['title'], 'description': item['description'], 'url': item['url']} for item in news]
    else:
        return []

# UI Components
def login_page():
    st.title("Crypto Backtest System")
    st.markdown("<h2 style='text-align: center; color: #fca311;'>Login</h2>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        if st.button("Login", key="login_button"):
            user = verify_user(username, password)
            if user:
                if is_user_expired(username) and not user[3]:  # user[3] is is_admin
                    st.error("Your account has expired. Please contact the administrator.")
                else:
                    st.session_state.user = user
                    st.session_state.username = username
                    st.success("Logged in successfully!")
                    st.rerun()
            else:
                st.error("Invalid username or password")
        if st.button("Register", key="register_button"):
            st.session_state.page = "register"
            st.rerun()

def register_page():
    st.title("Crypto Backtest System")
    st.markdown("<h2 style='text-align: center; color: #fca311;'>Register</h2>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        registration_code = st.text_input("Registration Code")
        if st.button("Register", key="register_submit"):
            if verify_registration_code(registration_code):
                try:
                    create_user(username, password)
                    st.success("Registered successfully! You can now login.")
                    st.session_state.page = "login"
                    st.rerun()
                except sqlite3.IntegrityError:
                    st.error("Username already exists")
            else:
                st.error("Invalid registration code")
        if st.button("Back to Login", key="back_to_login"):
            st.session_state.page = "login"
            st.rerun()

def add_or_edit_trade_form(user_id, trade_id=None):
    is_edit = trade_id is not None
    st.header("Edit Trade" if is_edit else "Add New Trade")
    
    if is_edit:
        c.execute("SELECT * FROM trades WHERE id=?", (trade_id,))
        trade = c.fetchone()
    else:
        trade = None
    
    form_key = f"trade_form_{trade_id}" if is_edit else "new_trade_form"
    with st.form(form_key):
        col1, col2 = st.columns(2)
        with col1:
            date = st.date_input("Start Date", value=datetime.fromisoformat(trade[2]).date() if trade else None)
            time = st.time_input("Start Time", value=datetime.fromisoformat(trade[2]).time() if trade else None)
            pair = st.selectbox("Trading Pair", get_trading_pairs(), index=get_trading_pairs().index(trade[4]) if trade else 0)
            amount = st.number_input("Amount", min_value=0.0, format="%.8f", value=float(trade[5]) if trade else 0.0)
            entry_price = st.number_input("Entry Price", min_value=0.0, format="%.8f", value=float(trade[6]) if trade else 0.0)
            trade_type = st.selectbox("Trade Type", ['long', 'short'], index=['long', 'short'].index(trade[13]) if trade and trade[13] else 0)
        with col2:
            end_date = st.date_input("End Date (Leave blank if trade is open)", value=datetime.fromisoformat(trade[3]).date() if trade and trade[3] else None)
            end_time = st.time_input("End Time (Leave blank if trade is open)", value=datetime.fromisoformat(trade[3]).time() if trade and trade[3] else None)
            exit_price = st.number_input("Exit Price (Leave 0 if trade is open)", min_value=0.0, format="%.8f", value=float(trade[7]) if trade and trade[7] else 0.0)
            strategy = st.selectbox("Strategy", get_analysis_types(), index=get_analysis_types().index(trade[8]) if trade and trade[8] in get_analysis_types() else 0)
        
        notes = st.text_area("Notes", value=trade[9] if trade else '')
        entry_screenshot = st.file_uploader("Upload Entry Screenshot", type=['png', 'jpg', 'jpeg'])
        exit_screenshot = st.file_uploader("Upload Exit Screenshot", type=['png', 'jpg', 'jpeg'])
        
        submitted = st.form_submit_button("Update Trade" if is_edit else "Add Trade")
        
        if submitted:
            # Perform validations
            if amount <= 0:
                st.error("Amount must be greater than 0")
                return
            if entry_price <= 0:
                st.error("Entry price must be greater than 0")
                return
            if exit_price < 0:
                st.error("Exit price cannot be negative")
                return
            if end_date and end_date < date:
                st.error("End date cannot be earlier than start date")
                return

            trade_data = {
                "date": datetime.combine(date, time).isoformat(),
                "end_date": datetime.combine(end_date, end_time).isoformat() if end_date and end_time else None,
                "pair": pair,
                "amount": amount,
                "entry_price": entry_price,
                "exit_price": exit_price if exit_price > 0 else None,
                "strategy": strategy,
                "notes": notes,
                "entry_screenshot": base64.b64encode(entry_screenshot.getvalue()).decode() if entry_screenshot else (trade[10] if trade else None),
                "exit_screenshot": base64.b64encode(exit_screenshot.getvalue()).decode() if exit_screenshot else (trade[11] if trade else None),
                "status": "completed" if exit_price > 0 else "active",
                "trade_type": trade_type
            }
            
            try:
                if is_edit:
                    success, message = update_trade(trade_id, trade_data)
                else:
                    success, message = save_trade(user_id, trade_data)
                
                if success:
                    st.success(message)
                    st.cache_data.clear()
                    st.rerun()
                else:
                    st.error(message)
            except Exception as e:
                st.error(f"An unexpected error occurred: {str(e)}")
                logger.error(f"Unexpected error in add_or_edit_trade_form: {str(e)}")

def show_trades_table(user_id):
    st.header("Trades Table")
    
    refresh_button = st.empty()
    if refresh_button.button("Refresh Data"):
        st.cache_data.clear()
        st.rerun()
    
    trades = load_user_trades(user_id)
    if trades:
        df = pd.DataFrame(trades, columns=['ID', 'User ID', 'Start Date', 'End Date', 'Pair', 'Amount', 'Entry Price', 'Exit Price', 'Strategy', 'Notes', 'Entry Screenshot', 'Exit Screenshot', 'Status', 'Trade Type'])
        df['Start Date'] = pd.to_datetime(df['Start Date'])
        df['End Date'] = pd.to_datetime(df['End Date'])
        df['Profit/Loss'] = df.apply(lambda row: get_trade_profit_loss(row), axis=1)
        df['Profit/Loss %'] = df.apply(lambda row: calculate_profit_loss_percentage(row), axis=1)
        
        # Improved table styling
        st.dataframe(df[['ID', 'Start Date', 'End Date', 'Pair', 'Amount', 'Entry Price', 'Exit Price', 'Strategy', 'Status', 'Trade Type', 'Profit/Loss', 'Profit/Loss %']].style.apply(
            lambda x: ['color: green' if v > 0 else 'color: red' if v < 0 else '' for v in x], subset=['Profit/Loss', 'Profit/Loss %']
        ))
        
        for trade in trades:
            with st.expander(f"Trade Details: {trade[4]} - {trade[2]}"):
                col1, col2, col3 = st.columns([2,1,1])
                with col1:
                    st.write(f"Trading Pair: {trade[4]}")
                    st.write(f"Amount: {trade[5]}")
                    st.write(f"Entry Price: {trade[6]}")
                    st.write(f"Exit Price: {trade[7] if trade[7] is not None else 'Not completed'}")
                    st.write(f"Strategy: {trade[8]}")
                    st.write(f"Notes: {trade[9]}")
                    st.write(f"Trade Type: {trade[13]}")
                    profit_loss = get_trade_profit_loss(trade)
                    profit_loss_percentage = calculate_profit_loss_percentage(trade)
                    color = "green" if profit_loss > 0 else "red"
                    st.markdown(f"Profit/Loss: <span style='color:{color}'>{profit_loss:.2f} ({profit_loss_percentage:.2f}%)</span>", unsafe_allow_html=True)
                    
                    risk_reward_ratio = calculate_risk_reward_ratio(trade)
                    if risk_reward_ratio:
                        st.write(f"Risk/Reward Ratio: {risk_reward_ratio:.2f}")
                    
                    if trade[3]:  # end_date exists
                        duration = datetime.fromisoformat(trade[3]) - datetime.fromisoformat(trade[2])
                        st.write(f"Trade Duration: {duration}")
                    
                    status = trade[12]  # status
                    if status == "completed":
                        if profit_loss > 0:
                            st.markdown(":green[Trade Successful] ✅")
                        else:
                            st.markdown(":red[Trade Failed] ❌")
                    elif status == "active":
                        st.markdown(":blue[Trade Active] 🔄")
                
                with col2:
                    if trade[10]:  # entry_screenshot
                        st.image(base64.b64decode(trade[10]), caption="Entry Screenshot", use_column_width=True)
                
                with col3:
                    if trade[11]:  # exit_screenshot
                        st.image(base64.b64decode(trade[11]), caption="Exit Screenshot", use_column_width=True)
                
                col4, col5 = st.columns(2)
                with col4:
                    if st.button(f"Edit Trade {trade[0]}", key=f"edit_{trade[0]}"):
                        st.session_state.editing_trade = trade[0]
                        st.rerun()
                
                with col5:
                    if st.button(f"Delete Trade {trade[0]}", key=f"delete_{trade[0]}"):
                        success, message = delete_trade(trade[0])
                        if success:
                            st.success(message)
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error(message)
    else:
        st.info("No trades to display")

def show_analysis(user_id):
    st.header("Performance Analysis")
    trades = load_user_trades(user_id)
    
    col1, col2, col3, col4 = st.columns(4)
    total_pnl = get_total_profit_loss(trades)
    win_rate = get_win_rate(trades)
    avg_pnl = get_average_profit_loss(trades)
    sharpe = get_sharpe_ratio(trades)
    
    col1.metric("Total Profit/Loss", f"${total_pnl:.2f}", delta=f"${total_pnl:.2f}")
    col2.metric("Win Rate", f"{win_rate*100:.2f}%")
    col3.metric("Avg Profit/Loss per Trade", f"${avg_pnl:.2f}", delta=f"${avg_pnl:.2f}")
    col4.metric("Sharpe Ratio", f"{sharpe:.2f}")
    
    max_dd = get_max_drawdown(trades)
    avg_duration = get_average_trade_duration(trades)
    
    st.metric("Maximum Drawdown", f"{max_dd*100:.2f}%")
    st.metric("Average Trade Duration", f"{avg_duration}")
    
    if trades:
        df = pd.DataFrame(trades, columns=['ID', 'User ID', 'Start Date', 'End Date', 'Pair', 'Amount', 'Entry Price', 'Exit Price', 'Strategy', 'Notes', 'Entry Screenshot', 'Exit Screenshot', 'Status', 'Trade Type'])
        df['Start Date'] = pd.to_datetime(df['Start Date'])
        df['End Date'] = pd.to_datetime(df['End Date'])
        df['Profit/Loss'] = df.apply(lambda row: get_trade_profit_loss(row), axis=1)
        df['Cumulative PnL'] = df['Profit/Loss'].cumsum()
        
        # Cumulative Profit/Loss Over Time
        fig = px.line(df, x='Start Date', y='Cumulative PnL', title='Cumulative Profit/Loss Over Time')
        fig.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig, use_container_width=True)
        
        # Profit/Loss by Strategy
        strategy_pnl = df.groupby('Strategy')['Profit/Loss'].sum().reset_index()
        fig = px.bar(strategy_pnl, x='Strategy', y='Profit/Loss', title='Profit/Loss by Strategy')
        fig.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig, use_container_width=True)
        
        # Trade Distribution by Pair
        pair_counts = df['Pair'].value_counts()
        fig = px.pie(pair_counts, values=pair_counts.values, names=pair_counts.index, title='Trade Distribution by Pair')
        fig.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig, use_container_width=True)
        
        # Win Rate Trend
        df['Win'] = df['Profit/Loss'] > 0
        df['Cumulative Win Rate'] = df['Win'].cumsum() / (df.index + 1)
        fig = px.line(df, x='Start Date', y='Cumulative Win Rate', title='Win Rate Trend')
        fig.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No trades to analyze")

def show_top_traders():
    st.header("Top Traders")
    top_traders = get_top_traders()
    if top_traders:
        df = pd.DataFrame(top_traders, columns=['Username', 'Total Trades', 'Winning Trades', 'Level'])
        df['Win Rate'] = df['Winning Trades'] / df['Total Trades']
        
        fig = px.bar(df, x='Username', y='Win Rate', title='Top Traders by Win Rate', 
                     hover_data=['Total Trades', 'Level'], color='Win Rate',
                     color_continuous_scale=px.colors.sequential.Viridis)
        fig.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig, use_container_width=True)
        
        st.dataframe(df.style.format({'Win Rate': '{:.2%}'}))
    else:
        st.info("No trader data available")

def show_market_data():
    st.header("Real-Time Market Data")
    symbol = st.selectbox("Select Cryptocurrency", ["BTC-USD", "ETH-USD", "ADA-USD", "XRP-USD", "DOT-USD", "DOGE-USD"])
    
    col1, col2 = st.columns(2)
    
    with col1:
        current_price = get_real_time_data(symbol)
        st.metric(label=f"Current {symbol} Price", value=f"${current_price:.2f}")
    
    with col2:
        refresh = st.button("Refresh Data")
        if refresh:
            st.rerun()
    
    # Display historical data and technical analysis
    st.subheader("Technical Analysis")
    data = perform_technical_analysis(symbol)
    
    # Plot price and indicators
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=data.index, y=data['Close'], name='Close Price'))
    fig.add_trace(go.Scatter(x=data.index, y=data['BB_high'], name='Bollinger High', line=dict(dash='dash')))
    fig.add_trace(go.Scatter(x=data.index, y=data['BB_low'], name='Bollinger Low', line=dict(dash='dash')))
    fig.update_layout(title=f"{symbol} Price and Bollinger Bands", xaxis_title="Date", yaxis_title="Price", template="plotly_dark", height=600)
    st.plotly_chart(fig, use_container_width=True)
    
    # MACD Plot
    fig_macd = go.Figure()
    fig_macd.add_trace(go.Scatter(x=data.index, y=data['MACD'], name='MACD'))
    fig_macd.add_trace(go.Scatter(x=data.index, y=data['Signal'], name='Signal Line'))
    fig_macd.update_layout(title="MACD", xaxis_title="Date", yaxis_title="Value", template="plotly_dark", height=600)
    st.plotly_chart(fig_macd, use_container_width=True)
    
    # RSI Plot
    fig_rsi = go.Figure()
    fig_rsi.add_trace(go.Scatter(x=data.index, y=data['RSI'], name='RSI'))
    fig_rsi.add_hline(y=70, line_dash="dash", line_color="red", annotation_text="Overbought")
    fig_rsi.add_hline(y=30, line_dash="dash", line_color="green", annotation_text="Oversold")
    fig_rsi.update_layout(title="RSI", xaxis_title="Date", yaxis_title="RSI Value", template="plotly_dark", height=600)
    st.plotly_chart(fig_rsi, use_container_width=True)

def user_profile(user_id):
    st.header("User Profile")
    
    c.execute("SELECT username, level, profile_picture, bio, risk_tolerance FROM users WHERE id=?", (user_id,))
    user = c.fetchone()
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        if user[2]:  # If profile picture exists
            image = Image.open(BytesIO(user[2]))
            st.image(image, caption="Profile Picture", use_column_width=True, clamp=True)
        else:
            st.image("https://www.w3schools.com/howto/img_avatar.png", caption="Default Profile Picture", use_column_width=True)
        
        uploaded_file = st.file_uploader("Upload new profile picture", type=["jpg", "jpeg", "png"])
        if uploaded_file is not None:
            update_profile_picture(user_id, uploaded_file)
            st.success("Profile picture updated successfully!")
            st.rerun()
    
    with col2:
        st.subheader(user[0])  # Username
        st.write(f"Level: {user[1]}")
        
        bio = st.text_area("Bio", value=user[3] if user[3] else "", max_chars=200)
        if st.button("Update Bio"):
            update_user_bio(user_id, bio)
            st.success("Bio updated successfully!")
        
        risk_tolerance = st.select_slider("Risk Tolerance", options=["Low", "Medium", "High"], value=user[4] if user[4] else "Medium")
        if st.button("Update Risk Tolerance"):
            update_user_risk_tolerance(user_id, risk_tolerance)
            st.success("Risk tolerance updated successfully!")
        
        trades = load_user_trades(user_id)
        total_trades = len(trades)
        win_rate = get_win_rate(trades)
        total_pnl = get_total_profit_loss(trades)
        
        st.write(f"Total Trades: {total_trades}")
        st.write(f"Win Rate: {win_rate*100:.2f}%")
        st.write(f"Total Profit/Loss: ${total_pnl:.2f}")
        
        # Progress to next level
        trades_to_next_level = (user[1] * 10) - total_trades
        if trades_to_next_level > 0:
            st.write(f"Trades needed for next level: {trades_to_next_level}")
            st.progress((total_trades % 10) / 10)
        else:
            st.write("Maximum level reached!")

def admin_panel():
    st.title("Admin Panel")
    
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(["User Management", "Registration Codes", "System Statistics", "Trade Analysis", "Trading Pairs & Strategies", "Backup Management"])
    
    with tab1:
        st.header("User Management")
        users = c.execute("SELECT id, username, is_admin, expiry_date, level FROM users").fetchall()
        user_df = pd.DataFrame(users, columns=['ID', 'Username', 'Is Admin', 'Expiry Date', 'Level'])
        st.dataframe(user_df.style.apply(lambda x: ['background: #4F4F4F' if x['Is Admin'] else '' for i in x], axis=1))
        
        # Extend user expiry
        st.subheader("Extend User Expiry")
        user_to_extend = st.selectbox("Select User", options=[user[1] for user in users], key="extend_user")
        new_expiry = st.date_input("New Expiry Date")
        if st.button("Extend Expiry", key="extend_expiry"):
            update_user_expiry(user_to_extend, new_expiry.isoformat())
            st.success(f"Expiry date for {user_to_extend} updated to {new_expiry}")
            st.rerun()
        
        # Delete user
        st.subheader("Delete User")
        user_to_delete = st.selectbox("Select User to Delete", options=[user[1] for user in users if not user[2]], key="delete_user")  # Exclude admins
        if st.button("Delete User", key="delete_user_button"):
            delete_user(user_to_delete)
            st.success(f"User {user_to_delete} deleted successfully")
            st.rerun()
        
        # View user trades
        st.subheader("View User Trades")
        selected_user = st.selectbox("Select User", options=[user[1] for user in users], key="view_trades_user")
        if st.button("View Trades", key="view_trades"):
            c.execute("SELECT id FROM users WHERE username=?", (selected_user,))
            user_id = c.fetchone()[0]
            show_trades_table(user_id)
    
    with tab2:
        # Registration code management
        st.header("Registration Code Management")
        current_code = get_current_registration_code()
        st.write(f"Current Registration Code: {current_code}")
        if st.button("Generate New Code", key="generate_code"):
            new_code = generate_registration_code()
            st.success(f"New registration code generated: {new_code}")
    
    with tab3:
        # System statistics
        st.header("System Statistics")
        total_users = len(users)
        total_trades = c.execute("SELECT COUNT(*) FROM trades").fetchone()[0]
        total_profit = c.execute("SELECT SUM((exit_price - entry_price) * amount) FROM trades WHERE exit_price IS NOT NULL").fetchone()[0]
        
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Users", total_users)
        col2.metric("Total Trades", total_trades)
        col3.metric("Total System Profit", f"${total_profit:.2f}" if total_profit else "N/A")
        
        # User growth over time
        user_creation_dates = c.execute("SELECT DATE(expiry_date, '-30 days') as creation_date FROM users").fetchall()
        user_growth_df = pd.DataFrame(user_creation_dates, columns=['Creation Date'])
        user_growth_df['Creation Date'] = pd.to_datetime(user_growth_df['Creation Date'])
        user_growth_df = user_growth_df.groupby('Creation Date').size().reset_index(name='New Users')
        user_growth_df['Cumulative Users'] = user_growth_df['New Users'].cumsum()
        
        fig = px.line(user_growth_df, x='Creation Date', y='Cumulative Users', title='User Growth Over Time')
        fig.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig, use_container_width=True)
    
    with tab4:
        st.header("Trade Analysis")
        all_trades = c.execute("SELECT * FROM trades").fetchall()
        trades_df = pd.DataFrame(all_trades, columns=['ID', 'User ID', 'Start Date', 'End Date', 'Pair', 'Amount', 'Entry Price', 'Exit Price', 'Strategy', 'Notes', 'Entry Screenshot', 'Exit Screenshot', 'Status', 'Trade Type'])
        trades_df['Start Date'] = pd.to_datetime(trades_df['Start Date'])
        trades_df['End Date'] = pd.to_datetime(trades_df['End Date'])
        trades_df['Profit/Loss'] = trades_df.apply(lambda row: get_trade_profit_loss(row), axis=1)
        
        # Trade volume over time
        fig_volume = px.bar(trades_df, x='Start Date', y='Amount', title='Trade Volume Over Time')
        fig_volume.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig_volume, use_container_width=True)
        
        # Most popular trading pairs
        pair_counts = trades_df['Pair'].value_counts()
        fig_pairs = px.pie(pair_counts, values=pair_counts.values, names=pair_counts.index, title='Most Popular Trading Pairs')
        fig_pairs.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig_pairs, use_container_width=True)
        
        # Most profitable strategies
        strategy_profits = trades_df.groupby('Strategy')['Profit/Loss'].sum().sort_values(ascending=False)
        fig_strategies = px.bar(strategy_profits, x=strategy_profits.index, y=strategy_profits.values, title='Most Profitable Strategies')
        fig_strategies.update_layout(template="plotly_dark", height=600)
        st.plotly_chart(fig_strategies, use_container_width=True)
    
    with tab5:
        st.header("Trading Pairs & Strategies Management")
        
        # Trading Pairs Management
        st.subheader("Trading Pairs")
        trading_pairs = get_trading_pairs()
        st.write("Current Trading Pairs:")
        st.write(", ".join(trading_pairs))
        
        col1, col2 = st.columns(2)
        with col1:
            new_pair = st.text_input("Add New Trading Pair")
            if st.button("Add Pair"):
                if new_pair:
                    success = add_trading_pair(new_pair)
                    if success:
                        st.success(f"Added {new_pair} to trading pairs")
                        st.rerun()
                    else:
                        st.error(f"Failed to add {new_pair}. It may already exist.")
                else:
                    st.warning("Please enter a trading pair to add")
        
        with col2:
            pair_to_remove = st.selectbox("Select Pair to Remove", options=trading_pairs)
            if st.button("Remove Pair"):
                delete_trading_pair(pair_to_remove)
                st.success(f"Removed {pair_to_remove} from trading pairs")
                st.rerun()
        
        # Strategies Management
        st.subheader("Strategies")
        strategies = get_analysis_types()
        st.write("Current Strategies:")
        st.write(", ".join(strategies))
        
        col3, col4 = st.columns(2)
        with col3:
            new_strategy = st.text_input("Add New Strategy")
            if st.button("Add Strategy"):
                if new_strategy:
                    success = add_analysis_type(new_strategy)
                    if success:
                        st.success(f"Added {new_strategy} to strategies")
                        st.rerun()
                    else:
                        st.error(f"Failed to add {new_strategy}. It may already exist.")
                else:
                    st.warning("Please enter a strategy to add")
        
        with col4:
            strategy_to_remove = st.selectbox("Select Strategy to Remove", options=strategies)
            if st.button("Remove Strategy"):
                delete_analysis_type(strategy_to_remove)
                st.success(f"Removed {strategy_to_remove} from strategies")
                st.rerun()
    
    with tab6:
        st.header("Backup Management")
        
        st.subheader("Manual Backup")
        if st.button("Create Backup Now"):
            backup_file = create_backup()
            st.success(f"Backup created successfully: {backup_file}")
        
        st.subheader("Automatic Backup Status")
        last_backup_time = get_last_backup_time()
        if last_backup_time:
            st.write(f"Last automatic backup was created on: {last_backup_time}")
        else:
            st.write("No automatic backups have been created yet.")
        
        st.subheader("Restore from Backup")
        backup_files = [f for f in os.listdir("backups") if f.endswith(".db")]
        if backup_files:
            selected_backup = st.selectbox("Select a backup to restore", options=backup_files)
            if st.button("Restore Selected Backup"):
                # Implement the restore logic here
                st.warning("Restore functionality not implemented yet.")
        else:
            st.write("No backup files available for restore.")

def main():
    if 'page' not in st.session_state:
        st.session_state.page = 'login'
    
    if 'user' not in st.session_state:
        if st.session_state.page == 'login':
            login_page()
        elif st.session_state.page == 'register':
            register_page()
    else:
        user = st.session_state.user
        
        # Custom theme
        custom_theme = {
            "backgroundColor": "#1E1E1E",
            "secondaryBackgroundColor": "#252525",
            "textColor": "#FAFAFA",
            "font": "sans serif"
        }
        
        # Apply custom theme
        st.markdown(f"""
        <style>
            .stApp {{
                background-color: {custom_theme["backgroundColor"]};
                color: {custom_theme["textColor"]};
                font-family: {custom_theme["font"]};
            }}
            .stSidebar {{
                background-color: {custom_theme["secondaryBackgroundColor"]};
            }}
            .stButton > button {{
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                transition-duration: 0.4s;
                cursor: pointer;
                border-radius: 5px;
                border: none;
            }}
            .stButton > button:hover {{
                background-color: #45a049;
            }}
            .stTextInput > div > div > input {{
                background-color: {custom_theme["secondaryBackgroundColor"]};
                color: {custom_theme["textColor"]};
            }}
            .stSelectbox > div > div > select {{
                background-color: {custom_theme["secondaryBackgroundColor"]};
                color: {custom_theme["textColor"]};
            }}
        </style>
        """, unsafe_allow_html=True)
        
        if user[3]:  # if user is admin
            selected = option_menu(
                menu_title=None,
                options=["Dashboard", "Trades", "Analysis", "Market Data", "Top Traders", "Profile", "Admin"],
                icons=["house", "list-task", "graph-up", "currency-exchange", "trophy", "person", "gear"],
                menu_icon="cast",
                default_index=0,
                orientation="horizontal",
                styles={
                    "container": {"padding": "0!important", "background-color": custom_theme["secondaryBackgroundColor"]},
                    "icon": {"color": "#fca311", "font-size": "25px"}, 
                    "nav-link": {"font-size": "15px", "text-align": "left", "margin":"0px", "--hover-color": "#4F4F4F"},
                    "nav-link-selected": {"background-color": "#4F4F4F"},
                }
            )
        else:
            selected = option_menu(
                menu_title=None,
                options=["Dashboard", "Trades", "Analysis", "Market Data", "Top Traders", "Profile"],
                icons=["house", "list-task", "graph-up", "currency-exchange", "trophy", "person"],
                menu_icon="cast",
                default_index=0,
                orientation="horizontal",
                styles={
                    "container": {"padding": "0!important", "background-color": custom_theme["secondaryBackgroundColor"]},
                    "icon": {"color": "#fca311", "font-size": "25px"}, 
                    "nav-link": {"font-size": "15px", "text-align": "left", "margin":"0px", "--hover-color": "#4F4F4F"},
                    "nav-link-selected": {"background-color": "#4F4F4F"},
                }
            )
        
        # Display user level prominently
        st.markdown(f"<div class='user-level'>Level: {user[4]}</div>", unsafe_allow_html=True)
        
        if selected == "Dashboard":
            st.title(f"Welcome, {st.session_state.username}!")
            
            # Market Overview
            st.subheader("Market Overview")
            col1, col2, col3 = st.columns(3)
            with col1:
                btc_price = get_real_time_data("BTC-USD")
                st.metric("Bitcoin (BTC)", f"${btc_price:.2f}")
            with col2:
                eth_price = get_real_time_data("ETH-USD")
                st.metric("Ethereum (ETH)", f"${eth_price:.2f}")
            with col3:
                xrp_price = get_real_time_data("XRP-USD")
                st.metric("Ripple (XRP)", f"${xrp_price:.2f}")
            
            # User's Recent Trades
            st.subheader("Your Recent Trades")
            recent_trades = load_user_trades(user[0])[:5]  # Get last 5 trades
            if recent_trades:
                recent_df = pd.DataFrame(recent_trades, columns=['ID', 'User ID', 'Start Date', 'End Date', 'Pair', 'Amount', 'Entry Price', 'Exit Price', 'Strategy', 'Notes', 'Entry Screenshot', 'Exit Screenshot', 'Status', 'Trade Type'])
                st.dataframe(recent_df[['Start Date', 'Pair', 'Amount', 'Status', 'Trade Type']])
            else:
                st.info("No recent trades")
            
            # Quick Stats
            st.subheader("Quick Stats")
            trades = load_user_trades(user[0])
            total_pnl = get_total_profit_loss(trades)
            win_rate = get_win_rate(trades)
            
            col1, col2, col3 = st.columns(3)
            col1.metric("Total Profit/Loss", f"${total_pnl:.2f}")
            col2.metric("Win Rate", f"{win_rate*100:.2f}%")
            col3.metric("Total Trades", len(trades))
            
            # Performance Chart
            st.subheader("Performance Over Time")
            if trades:
                df = pd.DataFrame(trades, columns=['ID', 'User ID', 'Start Date', 'End Date', 'Pair', 'Amount', 'Entry Price', 'Exit Price', 'Strategy', 'Notes', 'Entry Screenshot', 'Exit Screenshot', 'Status', 'Trade Type'])
                df['Start Date'] = pd.to_datetime(df['Start Date'])
                df['Profit/Loss'] = df.apply(lambda row: get_trade_profit_loss(row), axis=1)
                df['Cumulative PnL'] = df['Profit/Loss'].cumsum()
                
                fig = px.line(df, x='Start Date', y='Cumulative PnL', title='Cumulative Profit/Loss Over Time')
                fig.update_layout(template="plotly_dark", height=400)
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No trade data available for performance chart")
            
            # Crypto News
            st.subheader("Latest Crypto News")
            news_items = get_crypto_news()
            for item in news_items:
                with st.expander(item['title']):
                    st.write(item['description'])
                    st.markdown(f"[Read more]({item['url']})")
        
        elif selected == "Trades":
            if 'editing_trade' in st.session_state:
                add_or_edit_trade_form(user[0], st.session_state.editing_trade)
                del st.session_state.editing_trade
            else:
                add_or_edit_trade_form(user[0])
            show_trades_table(user[0])
        
        elif selected == "Analysis":
            show_analysis(user[0])
        
        elif selected == "Market Data":
            show_market_data()
        
        elif selected == "Top Traders":
            show_top_traders()
        
        elif selected == "Profile":
            user_profile(user[0])
        
        elif selected == "Admin" and user[3]:
            admin_panel()
        
        if st.sidebar.button("Logout"):
            del st.session_state.user
            del st.session_state.username
            st.session_state.page = 'login'
            st.rerun()

if __name__ == "__main__":
    main()