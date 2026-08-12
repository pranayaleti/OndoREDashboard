#!/usr/bin/env bash
# Ondo edit guard. Runs after Claude writes or edits a file.
# Fast, advisory greps for the two failure modes that cost the most:
# leaked scope ids and non-compliant user-facing copy.
# Exit 2 = surface the message to Claude so it can self-correct.

set -uo pipefail
payload="$(cat)"
file="$(printf '%s' "$payload" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)"
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

case "$file" in
  *node_modules*|*/dist/*|*/.next/*|*/out/*|*/coverage/*|*.lock|*.min.*) exit 0 ;;
  */.claude/agents/*|*/.claude/hooks/*|*/.claude/skills/*|*/AGENTS.md|*/CLAUDE.md) exit 0 ;;
  # Compliance tooling necessarily contains the vocabulary it screens for. Excluding it
  # keeps the guard from flagging its own rule tables, which is how a hook earns a reputation
  # for crying wolf and gets switched off.
  */utils/disclosures.ts|*/disclosures.test.ts|*/scripts/eval-assistant.ts|*/scripts/check-assistant-config-drift.ts) exit 0 ;;
esac

warn=""

# Opt-out for files that must legitimately contain restricted vocabulary (rule tables,
# fixtures, test cases). Add the marker in a comment and state why in the same line.
if grep -q 'ondo-guard: allow-restricted-vocabulary' "$file" 2>/dev/null; then
  skip_compliance=1
else
  skip_compliance=0
fi

# 1. IDOR: scope ids taken from client input instead of the verified JWT.
if printf '%s' "$file" | grep -qE 'OndoREBackend/src/(controllers|routes|services)/'; then
  hits=$(grep -nE 'req\.(params|body|query)\.(ownerId|owner_id|tenantId|tenant_id|userId|user_id|propertyId)' "$file" 2>/dev/null | head -5)
  [ -n "$hits" ] && warn="${warn}
[isolation] Scope id read from client input in $file:
$hits
Scope ids must come from the verified JWT, not the request. If this is a legitimate lookup
(not an authorization scope), confirm the query also filters by the session principal.
Run the tenant-isolation-auditor agent before shipping."
fi

# 2. Compliance: banned lending / fair-housing vocabulary in user-facing text.
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.md|*.mdx|*.html|*.json)
    [ "$skip_compliance" = "1" ] && hits="" || \
    hits=$(grep -niE "you qualify|pre-?approved|guaranteed (rate|approval|appreciation)|lowest rate|best rate|will appreciate|safe neighborhood|great for families|good schools|young professionals|no section 8|no vouchers" "$file" 2>/dev/null | head -5)
    [ -n "$hits" ] && warn="${warn}
[compliance] Restricted lending / Fair Housing language in $file:
$hits
Fair Housing: describe the property, never the intended occupant.
Lending: no guarantees, no implied credit decisions; NMLS + Reg Z disclosures required.
Run the license-compliance-guard agent before shipping."
    ;;
esac

# 3. Assistant config is the single source of truth.
case "$file" in
  *assistantConfig*)
    warn="${warn}
[drift] assistantConfig.ts changed. Mirror it to the Edge runtime and run:
  cd OndoREBackend && npm run check:drift && npm run check:routes"
    ;;
esac

# 4. New scoped table without RLS in the same migration.
case "$file" in
  *supabase/migrations/*.sql)
    if grep -qiE 'create table' "$file" && ! grep -qi 'enable row level security' "$file"; then
      warn="${warn}
[migration] CREATE TABLE without ENABLE ROW LEVEL SECURITY in $file.
Any table holding tenant, owner, lease, payment, document, or message data must have RLS and
policies in the same migration. Run the migration-smith agent."
    fi
    ;;
esac

if [ -n "$warn" ]; then
  printf 'Ondo edit guard:%s\n' "$warn" >&2
  exit 2
fi
exit 0
