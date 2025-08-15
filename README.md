# DineFlow

**Restaurant Management App for Small Businesses**  

**Website:** [DineFlow Live](http://dine-flow.s3-website.us-east-2.amazonaws.com/)

---

## Overview
**DineFlow** is a sophisticated full-stack application designed to **streamline restaurant operations** for small businesses.  
It allows customers to order via QR codes while giving kitchen and waiter staff a **real-time, intuitive dashboard** to track and manage orders efficiently.  
The system supports **role-based access**, ensuring each user sees only what they need.

---

## Features
- **QR Code-Based Table Ordering** – Customers can place orders directly from their table.  
- **Real-Time Order Tracking** – Kitchen and waiters receive instant updates on order status.  
- **Waiter & Kitchen Dashboards** – Manage and monitor orders efficiently.  
- **Admin Dashboard** – Manage menu items, employees, and view detailed sales statistics.  
- **Customizable Table QR Codes** – Generate QR codes with custom branding and design.  
- **Role-Based Authentication** – Admin, Waiter, Kitchen access with secure login.  

---

## Impact
- **Accelerates order processing** and reduces wait times.  
- **Streamlines staff workflow**, allowing efficient management of multiple tables.  
- **Secure and scalable** full-stack design with JWT authentication.  
-**Showcases modern web architecture** deployed on AWS.  

---

## Tech Stack

**Frontend**  
- **React** – Dynamic, component-based UI.  
- **Tailwind CSS** – Utility-first styling framework for fast, responsive design.  
- **Axios** – HTTP requests to backend APIs.  
- **React Router** – Handles page routing within the app.  

**Backend**  
- **Java** – Core business logic.  
- **Spring Boot** – Simplifies backend setup and REST API development.
- **REST API Design** – CRUD endpoints for orders, menu, users, etc.
- **Spring Security** – Role-based authentication with JWT support.
- **Spring MVC** – Handles HTTP requests, controllers, and routing in the backend.
- **Spring Data JPA / Hibernate** – ORM layer for managing database entities and queries.
- **WebSockets** – Real-time communication for orders and notifications.
- **JWT (JSON Web Tokens)** – Stateless, secure authentication.  
- **MySQL Connector/J (JDBC)** – Database connectivity.  

**Database**  
- **MySQL (AWS RDS)** – Stores orders, menu items, and employee data.  

**Hosting & Deployment**  
- **AWS EC2** – Hosts the backend Spring Boot application.  
- **AWS S3** – Serves the frontend React app as a static website.  

**Other Tools**  
- **Maven** – Java build and dependency management.  
- **Postman** – API testing during development.  

---

## Usage
1. Customers scan QR codes to view the menu and place orders.  
2. Waiters receive notifications for new orders and help requests.  
3. Kitchen staff updates the status of orders (in-progress, ready).  
4. Admins manage menu items, employees, and view sales statistics.  

---

## Demo / Portfolio Notice
This project is a **demonstration of the Smart Order & Service System** built for my family’s restaurant.  
All data shown is **fake**, and this deployment is for **portfolio or educational purposes only**.  
**It is not a live ordering platform.**
