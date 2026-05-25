#!/usr/bin/env python3
"""
One-time migration: hash plaintext passwords + normalize legacy role strings.
Safe to run multiple times (idempotent).

Usage:
    SUPABASE_URL=... SUPABASE_KEY=... python migrate_passwords.py
    SUPABASE_URL=... SUPABASE_KEY=... MIGRATE_DRY_RUN=1 python migrate_passwords.py
"""
import os
import sys
from passlib.hash import bcrypt
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
DRY_RUN = os.environ.get("MIGRATE_DRY_RUN", "").strip() == "1"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_KEY before running.")
    sys.exit(1)

# Per-user role assignments. Keyed by username; value is the canonical role to set.
# Any user whose username is NOT listed here will have their role left exactly as-is.
USER_ROLE_ASSIGNMENTS = {
    "admin":       "owner_admin",
    "jsmith":      "salesperson",
    "servicedept": "technician",
}

if DRY_RUN:
    print("\n*** DRY RUN — no changes will be written to the database ***\n")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)
users = sb.table("users").select("id,username,password,role").execute().data

print(f"Found {len(users)} user(s).\n")

changed = skipped = 0

for u in users:
    uid, username = u["id"], u["username"]
    password = u.get("password") or ""
    role = u.get("role") or ""
    updates = {}
    notes = []

    # Password — idempotent: bcrypt hashes are detected by their $2b$/$2a$/$2y$ prefix
    if password.startswith(("$2b$", "$2a$", "$2y$")):
        notes.append("password already hashed")
    elif password.strip():
        updates["password"] = bcrypt.hash(password)
        notes.append("hash password")
    else:
        notes.append("WARNING: empty password — skipping hash")

    # Role — per-user assignment; username not in table → leave unchanged (idempotent)
    if username in USER_ROLE_ASSIGNMENTS:
        new_role = USER_ROLE_ASSIGNMENTS[username]
        if role != new_role:
            updates["role"] = new_role
            notes.append(f"role '{role}' -> '{new_role}'")
        else:
            notes.append(f"role already '{role}'")
    elif role:
        notes.append(f"username not in USER_ROLE_ASSIGNMENTS — role '{role}' leaving unchanged")
    else:
        notes.append("WARNING: username not in USER_ROLE_ASSIGNMENTS and role empty — leaving unchanged")

    tag = "[DRY RUN]" if DRY_RUN else "[APPLY  ]"
    if updates:
        changed += 1
        print(f"  {tag} [{uid}] {username}: {', '.join(notes)}")
        if not DRY_RUN:
            sb.table("users").update(updates).eq("id", uid).execute()
    else:
        skipped += 1
        print(f"  [SKIP   ] [{uid}] {username}: {', '.join(notes)}")

suffix = "DRY RUN complete" if DRY_RUN else "Migration complete"
print(f"\n{suffix} — {changed} updated, {skipped} skipped.\n")
if DRY_RUN:
    print("Re-run without MIGRATE_DRY_RUN=1 to apply.\n")
