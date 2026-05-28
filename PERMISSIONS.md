# CARSATION DMS — Permission Matrix & Role Specification

**Owner:** Duane Berkey — Carsation LLC, Bridgeport CT
**Last updated:** 2026-05-25
**Status:** Spec — implementation pending (Phase 3 RBAC)

---

## Overview

CARSATION DMS uses a hybrid permission model:

1. 9 role templates define baseline permission sets.
2. Owner/Admin can customize permissions a la carte when creating or editing any user. Templates are starting points, not hard rules.
3. Routes/actions check permissions, not roles. A user can have a Salesperson template + 2 extra granted permissions; their access is the union.

This means Phase 3 implementation uses permission-based guards (require_permission("inventory.delete")), not role-based guards.

---

## The 9 Role Templates

| Code | Display Name | Purpose |
|---|---|---|
| owner_admin | Owner / Admin | Full system access. Only role that can customize other users' permissions. |
| sales_manager | Sales Manager | Runs sales floor. Manages inventory, deals, salespeople. |
| service_manager | Service Manager | Runs service department. Manages ROs, advisors, technicians. |
| salesperson | Salesperson | Works own deals and customers. No cost/gross visibility. |
| service_advisor | Service Advisor | Writes ROs, manages service customers. |
| technician | Technician | Performs service work, logs own labor time. |
| detailer | Detailer | Detailing department. Updates vehicle status only. |
| accounting | Accounting | Financial operations, reports, deal funding. |
| read_only | Read Only | View-only access. Intended for outside CPAs, auditors, board members. |

---

## Cross-Module Visibility Rules

1. Sales Manager - Service ROs: Can VIEW all ROs (open and closed) on both inventory vehicles AND sold vehicles, including line items and totals. Cannot view RO profitability/margin. Cannot create, edit, close, or reopen ROs.

2. Service Manager - Deals: Can view basic deal info (customer name, vehicle, sale date, sold-by-us flag, warranty status) for service workflow. Cannot view financial details (sale price, gross, commission, financing terms).

3. Service Manager - Customers: Sees only customers who have service history. Does NOT see sales-only leads.

4. Salesperson - Customers/Deals: Sees ONLY their assigned customers and their own deals. Cannot see other salespeople's data.

5. Technician - ROs: Can view all ROs but can only log their OWN labor time. Cannot edit other tech's time.

6. Owner/Admin and Accounting: No restrictions on financial visibility.

7. Open RO Warning: When Sales Manager opens a deal jacket for a vehicle with an open RO, the system displays a warning banner. Deal cannot be marked Sold while RO is open without explicit override.

---

## Permission Catalog

All permissions follow the pattern module.action[.modifier].

### Inventory Module

- inventory.view_list - View list of all vehicles in inventory
- inventory.view_detail - View single vehicle's full details
- inventory.create - Add new vehicle (stock in)
- inventory.edit - Edit vehicle (price, notes, specs)
- inventory.delete - Delete vehicle from inventory
- inventory.update_status - Update vehicle status (recon to detail to frontline)
- inventory.view_cost - View vehicle cost basis

### Deals Module

- deals.view_all - View all deals
- deals.view_own - View own deals only
- deals.view_detail - View deal details
- deals.create - Create new deal
- deals.edit_working - Edit deal in Working status
- deals.edit_post_funding - Edit deal in Pending Funding or Funded status
- deals.change_status_to_sold - Mark deal as Sold
- deals.change_status_to_funded - Mark deal as Funded
- deals.delete - Delete deal
- deals.view_gross - View gross profit
- deals.view_own_commission - View own commission
- deals.view_all_commissions - View all commissions
- deals.manage_commission_rules - Set/edit commission rules

### Service / Repair Orders Module

- service.view_ro_list - View list of all ROs
- service.view_ro_detail - View single RO details
- service.create_ro - Create new RO
- service.edit_ro - Edit RO header
- service.edit_labor - Add/edit labor lines
- service.edit_parts - Add/edit parts
- service.log_own_time - Log own technician time
- service.log_any_time - Log/edit any tech's time
- service.update_ro_status - Update RO status
- service.close_ro - Close/finalize RO
- service.reopen_ro - Reopen closed RO
- service.take_payment - Take/record payment
- service.delete_ro - Delete RO
- service.view_ro_profitability - View RO profit margin
- service.send_communication - Send service email/SMS
- service.view_ro_inventory_vehicles - View ROs on inventory vehicles
- service.view_ro_sold_vehicles - View ROs on sold vehicles

### Users / System Admin Module

- users.view_list - View user list
- users.view_detail - View user details
- users.create - Create new user
- users.edit_basic - Edit user name/email/phone (NOT role)
- users.assign_role - Assign/change role template
- users.customize_permissions - Customize individual permissions per user
- users.deactivate - Deactivate user
- users.reactivate - Reactivate user
- users.reset_password - Reset another user's password
- users.delete - Hard-delete user
- users.view_audit_log - View audit log
- users.manage_own_profile - Edit own name/password/contact

### Reports / Dashboard Module

- reports.sales_dashboard - Sales dashboard
- reports.service_dashboard - Service dashboard
- reports.inventory_report - Inventory aging/recon spend
- reports.salesperson_scoreboard_all - All salespeople's stats
- reports.salesperson_scoreboard_own - Own stats only
- reports.tech_productivity_all - All techs productivity
- reports.tech_productivity_own - Own productivity only
- reports.financial_statements - P&L, balance sheet
- reports.daily_cash - Daily cash report
- reports.lender_funding - Lender funding status
- reports.marketplace_performance - Marketplace lead source
- reports.recon_cost - Per-vehicle recon cost
- reports.custom_report_builder - Custom report builder
- reports.export - Export to PDF/Excel
- reports.view_ro_profitability - Service profitability reports

### Customers / CRM Module

- customers.view_all - Full customer list
- customers.view_own - Only assigned customers/leads
- customers.view_service_only - Service customers only
- customers.view_detail - Customer details
- customers.create - Create customer/lead
- customers.edit - Edit customer info
- customers.reassign_lead - Reassign lead to different salesperson
- customers.delete - Delete/merge customer
- customers.add_notes - Add notes
- customers.send_communication - Send email/SMS
- customers.view_communications - View communication history
- customers.schedule_appointment - Schedule appointment
- customers.view_credit_info - View credit app status, FICO
- customers.run_credit_app - Run credit application
- customers.mark_lost - Mark as Lost/Dead lead
- customers.export_list - Export customer list

---

## Role Template Defaults

Legend: Y = granted | N = not granted | own = scoped to own records | basic = financial fields hidden | view = view-only access | sales-side = sales-side users only | service-side = service-side users only

### Inventory

| Permission | Owner | SalesMgr | SvcMgr | Sales | SvcAdv | Tech | Detail | Acct | ReadOnly |
|---|---|---|---|---|---|---|---|---|---|
| inventory.view_list | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| inventory.view_detail | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| inventory.create | Y | Y | N | N | N | N | N | N | N |
| inventory.edit | Y | Y | N | N | N | N | N | N | N |
| inventory.delete | Y | Y | N | N | N | N | N | N | N |
| inventory.update_status | Y | Y | N | N | N | Y | Y | N | N |
| inventory.view_cost | Y | Y | N | N | N | N | N | Y | N |

### Deals

| Permission | Owner | SalesMgr | SvcMgr | Sales | SvcAdv | Tech | Detail | Acct | ReadOnly |
|---|---|---|---|---|---|---|---|---|---|
| deals.view_all | Y | Y | N | N | N | N | N | Y | Y |
| deals.view_own | Y | Y | N | Y | N | N | N | Y | N |
| deals.view_detail | Y | Y | basic | own | basic | N | N | Y | Y |
| deals.create | Y | Y | N | Y | N | N | N | N | N |
| deals.edit_working | Y | Y | N | own | N | N | N | N | N |
| deals.edit_post_funding | Y | Y | N | N | N | N | N | Y | N |
| deals.change_status_to_sold | Y | Y | N | own | N | N | N | N | N |
| deals.change_status_to_funded | Y | Y | N | N | N | N | N | Y | N |
| deals.delete | Y | Y | N | N | N | N | N | N | N |
| deals.view_gross | Y | N | N | N | N | N | N | Y | N |
| deals.view_own_commission | Y | Y | N | Y | N | N | N | Y | N |
| deals.view_all_commissions | Y | Y | N | N | N | N | N | Y | N |
| deals.manage_commission_rules | Y | Y | N | N | N | N | N | Y | N |

### Service / ROs

| Permission | Owner | SalesMgr | SvcMgr | Sales | SvcAdv | Tech | Detail | Acct | ReadOnly |
|---|---|---|---|---|---|---|---|---|---|
| service.view_ro_list | Y | view | Y | N | Y | Y | N | Y | Y |
| service.view_ro_detail | Y | view | Y | N | Y | Y | N | Y | Y |
| service.create_ro | Y | N | Y | N | Y | N | N | N | N |
| service.edit_ro | Y | N | Y | N | Y | N | N | N | N |
| service.edit_labor | Y | N | Y | N | Y | N | N | N | N |
| service.edit_parts | Y | N | Y | N | Y | N | N | N | N |
| service.log_own_time | Y | N | Y | N | Y | Y | N | N | N |
| service.log_any_time | Y | N | Y | N | Y | N | N | N | N |
| service.update_ro_status | Y | N | Y | N | Y | Y | N | N | N |
| service.close_ro | Y | N | Y | N | Y | N | N | N | N |
| service.reopen_ro | Y | N | Y | N | N | N | N | Y | N |
| service.take_payment | Y | N | Y | N | Y | N | N | Y | N |
| service.delete_ro | Y | N | Y | N | N | N | N | N | N |
| service.view_ro_profitability | Y | N | Y | N | N | N | N | Y | Y |
| service.send_communication | Y | N | Y | N | Y | N | N | N | N |
| service.view_ro_inventory_vehicles | Y | Y | Y | N | Y | Y | N | Y | Y |
| service.view_ro_sold_vehicles | Y | Y | Y | N | Y | Y | N | Y | Y |

### Users / System Admin

| Permission | Owner | SalesMgr | SvcMgr | Sales | SvcAdv | Tech | Detail | Acct | ReadOnly |
|---|---|---|---|---|---|---|---|---|---|
| users.view_list | Y | Y | Y | N | N | N | N | N | N |
| users.view_detail | Y | Y | Y | N | N | N | N | N | N |
| users.create | Y | N | N | N | N | N | N | N | N |
| users.edit_basic | Y | sales-side | service-side | N | N | N | N | N | N |
| users.assign_role | Y | N | N | N | N | N | N | N | N |
| users.customize_permissions | Y | N | N | N | N | N | N | N | N |
| users.deactivate | Y | sales-side | service-side | N | N | N | N | N | N |
| users.reactivate | Y | N | N | N | N | N | N | N | N |
| users.reset_password | Y | sales-side | service-side | N | N | N | N | N | N |
| users.delete | Y | N | N | N | N | N | N | N | N |
| users.view_audit_log | Y | N | N | N | N | N | N | N | N |
| users.manage_own_profile | Y | Y | Y | Y | Y | Y | Y | Y | Y |

### Reports / Dashboard

| Permission | Owner | SalesMgr | SvcMgr | Sales | SvcAdv | Tech | Detail | Acct | ReadOnly |
|---|---|---|---|---|---|---|---|---|---|
| reports.sales_dashboard | Y | Y | N | N | N | N | N | Y | Y |
| reports.service_dashboard | Y | N | Y | N | N | N | N | Y | Y |
| reports.inventory_report | Y | Y | N | N | N | N | N | Y | Y |
| reports.salesperson_scoreboard_all | Y | Y | N | N | N | N | N | Y | N |
| reports.salesperson_scoreboard_own | Y | Y | N | Y | N | N | N | Y | N |
| reports.tech_productivity_all | Y | N | Y | N | N | N | N | Y | N |
| reports.tech_productivity_own | Y | N | Y | N | N | Y | N | Y | N |
| reports.financial_statements | Y | N | N | N | N | N | N | Y | Y |
| reports.daily_cash | Y | N | N | N | N | N | N | Y | N |
| reports.lender_funding | Y | Y | N | N | N | N | N | Y | N |
| reports.marketplace_performance | Y | Y | N | N | N | N | N | N | N |
| reports.recon_cost | Y | Y | Y | N | N | N | N | Y | N |
| reports.custom_report_builder | Y | N | N | N | N | N | N | Y | N |
| reports.export | Y | Y | Y | N | N | N | N | Y | N |
| reports.view_ro_profitability | Y | N | Y | N | N | N | N | Y | Y |

### Customers / CRM

| Permission | Owner | SalesMgr | SvcMgr | Sales | SvcAdv | Tech | Detail | Acct | ReadOnly |
|---|---|---|---|---|---|---|---|---|---|
| customers.view_all | Y | Y | N | N | Y | N | N | Y | Y |
| customers.view_own | Y | Y | Y | Y | Y | N | N | Y | Y |
| customers.view_service_only | Y | Y | Y | N | Y | N | N | Y | Y |
| customers.view_detail | Y | Y | Y | own | Y | N | N | Y | Y |
| customers.create | Y | Y | Y | Y | Y | N | N | N | N |
| customers.edit | Y | Y | Y | own | Y | N | N | Y | N |
| customers.reassign_lead | Y | Y | N | N | N | N | N | N | N |
| customers.delete | Y | Y | N | N | N | N | N | N | N |
| customers.add_notes | Y | Y | Y | own | Y | N | N | Y | N |
| customers.send_communication | Y | Y | Y | own | Y | N | N | N | N |
| customers.view_communications | Y | Y | Y | own | Y | N | N | Y | Y |
| customers.schedule_appointment | Y | Y | Y | own | Y | N | N | N | N |
| customers.view_credit_info | Y | Y | N | own | N | N | N | Y | N |
| customers.run_credit_app | Y | Y | N | Y | N | N | N | N | N |
| customers.mark_lost | Y | Y | N | own | N | N | N | N | N |
| customers.export_list | Y | Y | N | N | N | N | N | Y | N |

---

## Implementation Notes for Phase 3+

### Database Schema Additions

ALTER TABLE users ADD COLUMN permission_overrides JSONB DEFAULT '{}'::jsonb;

permission_overrides example:
{
  "grant": ["inventory.view_cost", "deals.view_gross"],
  "revoke": ["customers.delete"]
}

### Permission Resolution Algorithm

For each request:

1. Look up the user's role (e.g., salesperson).
2. Load the role's default permission set.
3. Apply permission_overrides.grant (add permissions).
4. Apply permission_overrides.revoke (remove permissions).
5. Check if the required permission is in the resulting set.
6. Apply scoping rules where applicable (own only, basic only, etc.).

### FastAPI Implementation Pattern

@app.delete("/inventory/{stock_id}")
def delete_vehicle(
    stock_id: int,
    current_user = Depends(get_current_user),
    _ = Depends(require_permission("inventory.delete"))
):
    ...

### Critical Security Notes

- Only owner_admin can grant users.customize_permissions to others.
- The users.customize_permissions permission itself requires direct Owner/Admin assignment.
- Every permission change MUST be logged in the audit log (Phase 4).
- The User Management UI should show warning dialogs before granting dangerous permissions (anything ending in .delete, .view_cost, .view_gross, .assign_role).

### Cross-Module Visibility Special Logic

- sales-side users: Sales Manager can only edit/deactivate users with roles in {salesperson, sales_manager}.
- service-side users: Service Manager can only edit/deactivate users with roles in {service_advisor, technician, detailer, service_manager}.
- basic-only deal visibility: Response omits sale_price, gross, commission, financing_terms.
- own-only scoping: SQL filters WHERE salesperson_id = current_user.id.
- view-only RO access for Sales Manager: UI hides Edit/Close/Add Line buttons.

---

## Open Items for Future Sessions

1. Manage Website permission - to be added when public website module is built. Default grants: Owner/Admin + Sales Manager.
2. Marketplace Syndication permissions - when syndication module is built.
3. Accounting module deep dive - separate audit when full accounting features built.
4. Customer Portal permissions - separate auth system; not in this matrix.
5. Phase 4 (Audit Log) - MUST be live before per-user permission customization UI ships.
