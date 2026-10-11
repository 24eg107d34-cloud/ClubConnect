# ClubConnect — College Club Management System

## About the Project
ClubConnect is a web-based College Club Management System that helps students explore college clubs and register for activities. It also provides an admin dashboard to view and manage student registrations.

## Features
- View available college clubs.
- View club details.
- Register for clubs.
- Student signup and login.
- Admin login and registration dashboard.
- Store club and registration information in MySQL.

## Technologies Used
**Frontend:** React, Vite, HTML, CSS, JavaScript

**Backend:** Node.js, Express.js

**Database:** MySQL

## Project Structure
- `frontend/` — React user interface
- `backend/` — Express API and database connection

## How to Run the Project

### 1. Clone the Repository
```bash
git clone https://github.com/24eg107d34-cloud/ClubConnect.git
cd ClubConnect
```

### 2. Run the Backend
```bash
cd backend
npm install
```

Configure your local `.env` file with your MySQL connection details and required authentication settings.

Start the backend:
node server.js


The backend runs at `http://localhost:5000`.

### 3. Run the Frontend
Open a new terminal:
cd frontend
npm install
npm run dev

Open `http://localhost:5173` in your browser.

### 4. Database Setup
Create a MySQL database named `college_club` and configure the database connection in the backend `.env` file. The database tables must be created before using the application.

## Repository
https://github.com/24eg107d34-cloud/ClubConnect

## Author
Karnati Harini

B.Tech — Artificial Intelligence and Machine Learning
