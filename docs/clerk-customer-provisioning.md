# Clerk Billing customer provisioning (PowerShell)

This walkthrough uses an already authenticated RevTurbine operator and Clerk
instance. Your application's user and account IDs are independent of that
operator login. Run against a development tenant/environment first.

Create the upstream user with `clerk users create --help` and the appropriate
options for your app, or use an existing user. Create an organization if the
account represents a business. Create the Billing plan in Clerk's dashboard;
the Backend API does not provide a plan-create operation. Inspect its prices
with the Clerk CLI's `api` command (see `clerk api --help`). Capture the actual
user/organization, Billing plan, and Billing price IDs. Do not substitute Stripe
product or price IDs. Stripe CLI is unnecessary for this setup.

Supply these values from your own Clerk instance and RevTurbine environment:

```powershell
$environmentHandle = Read-Host 'RevTurbine environment handle (for example production)'
$clerkInstanceId = Read-Host 'Clerk instance ID'
$clerkUserId = Read-Host 'Existing Clerk user ID'
$clerkPlanId = Read-Host 'Existing Clerk Billing plan ID'
$clerkPriceId = Read-Host 'Existing Clerk Billing monthly USD price ID'
$scope = @('--environment', $environmentHandle, '--provider-instance', $clerkInstanceId)

# These are application IDs, not RevTurbine operator IDs.
@{ account_id = 'app-personal-42'; name = 'Personal account' } | ConvertTo-Json | Set-Content account.json
@{ user_id = 'app-user-42'; account_id = 'app-personal-42' } | ConvertTo-Json | Set-Content user.json
revturbine customer-accounts create account.json --json
revturbine customer-users create user.json --json

@{ external_entity_type = 'user'; external_id = $clerkUserId } | ConvertTo-Json | Set-Content clerk-user-link.json
revturbine customer-accounts link app-personal-42 clerk-user-link.json @scope --json
revturbine customer-users link app-user-42 clerk-user-link.json @scope --json
revturbine customer-users get app-user-42 --json
revturbine customer-users links app-user-42 @scope --json

# A named plan creates a draft if needed. Cross-entity references use handles,
# including variation.plan_id; do not use the returned database row ID.
@{ name = 'Pro'; handle = 'pro'; tier_position = 1 } | ConvertTo-Json | Set-Content plan.json
revturbine plans create plan.json --environment $environmentHandle --draft --json
$planHandle = Read-Host 'Stable plan handle returned by create (for example pro)'
@{
  plan_id = $planHandle; billing_period = 'monthly'; currency = 'usd'
  price_amount = 1200; pricing_model = 'flat'; price_source = 'clerk'
} | ConvertTo-Json | Set-Content variation.json
# Match price_amount to your Clerk price in currency minor units.
revturbine plan-variations create variation.json --environment $environmentHandle --draft --json
revturbine plan-variations list --environment $environmentHandle --draft --all --json
$variationHandle = Read-Host 'Stable variation handle returned by create/list'

@{ external_entity_type = 'billing_plan'; external_id = $clerkPlanId } | ConvertTo-Json | Set-Content clerk-plan-link.json
@{
  external_entity_type = 'billing_price'; external_id = $clerkPriceId
  billing_period = 'monthly'; currency = 'usd'
} | ConvertTo-Json | Set-Content clerk-price-link.json
revturbine plans link $planHandle clerk-plan-link.json @scope --draft --json
revturbine plan-variations link $variationHandle clerk-price-link.json @scope --draft --json
revturbine plan-variations links $variationHandle @scope --draft --json
```

For a business account, use `external_entity_type: "organization"` and the
organization ID for the account link; keep the user's separate `user` link.
Use a different provider-instance scope for development and production Clerk
instances. Account/user records are tenant scoped; their external links are
environment scoped.

Repeat account/user/link creates safely with identical input. A changed account
association, changed external ID, or already-bound external entity produces
409. If catalog creation loses its response, inspect `list --draft` before
creating again. Draft authoring never changes the live release; launch is a
separate existing workflow. Check `--live` or `--release <id>` explicitly to
inspect those catalog versions after deployment.

Provider references remain private operational data and are not embedded in
portable Playbooks. Price snapshots are authored values; no provider verification
or subscription synchronization is implied by this workflow.

References: [Clerk CLI](https://clerk.com/docs/cli),
[Billing overview](https://clerk.com/docs/guides/billing/overview),
[custom prices](https://clerk.com/docs/guides/billing/custom-plans),
[Backend API](https://clerk.com/docs/reference/backend-api/2026-05-12/description/introduction).
