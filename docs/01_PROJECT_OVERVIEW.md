# 01 — Project Overview

> Master spec source: `../spec.md` | Model/feature source: `../model.md`

## Name

**ShelfWise AI** — AI-Powered Smart Inventory & Expiry Loss Prediction Platform

## Mission

ShelfWise AI helps retailers reduce financial losses by:

- Predicting inventory expiry before it happens
- Forecasting demand per product
- Recommending discounts for near-expiry and slow-moving stock
- Optimizing stock levels (reorder points, safety stock)

## Problem

Retail stores, medical stores, pharmacies, supermarkets, and warehouses lose money because of:

- Products expiring before they are sold
- Slow-moving inventory blocking shelf space and cash
- Poor demand forecasting
- Overstocking
- Stock shortages (out-of-stock revenue loss)
- Manual, error-prone inventory management

## What This Project IS

- Inventory Intelligence Platform
- Business Optimization Platform
- AI Decision Support System
- Retail Analytics Platform
- Demand Forecasting Platform

## What This Project Is NOT

- Not a billing software
- Not a POS
- Not an accounting software
- Not an ERP

## Goals

Primary: **Predict inventory loss before it happens.**

Secondary:

1. Digitize invoices (OCR)
2. Inventory automation
3. AI recommendations
4. Financial analytics
5. Demand forecasting
6. Expiry prediction
7. Business intelligence

## Users & Roles

| Role | Capabilities |
|---|---|
| Admin | Full access, user management, all modules, settings |
| Manager | Inventory CRUD, OCR, AI review, reports, recommendations |
| Inventory Staff | Product/inventory entry, OCR uploads, manual correction |
| Viewer | Read-only dashboards and reports |

## Engineering Principles

- Clean Architecture
- SOLID
- Repository Pattern
- MVC
- Service Layer
- Reusable Components
- Dependency Injection
- REST API
- Modular Design
- Production Ready
- Scalable
- Maintainable

## Success Criteria

1. Authentication complete (JWT + refresh cookie + RBAC)
2. Inventory CRUD complete
3. OCR working (Vision API with Tesseract fallback)
4. AI recommendations working
5. Dashboard functional
6. Reports generated
7. Deployment successful (Vercel + Render + Atlas)
8. No critical bugs
9. Code follows engineering standards

## Development Methodology

Specification-Driven Development: every implementation decision is traceable to this `docs/` set and `../spec.md`.
