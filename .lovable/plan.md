## Plan

The admin login is working; this 401 is coming from SAM.gov rejecting the `SAM_API_KEY` used by the sync function.

1. **Verify the runtime secret**
   - Check that `SAM_API_KEY` exists as a Lovable/Supabase runtime secret.
   - Confirm it is non-empty without exposing the value.
   - If needed, prompt you to securely re-enter the new SAM.gov key.

2. **Confirm the sync function is using the right secret**
   - Inspect the SAM sync edge-function code path that calls SAM.gov.
   - Verify it reads `SAM_API_KEY` and passes it to the SAM.gov Opportunities endpoint in the expected way.
   - Make no client-side changes and never expose the key in frontend code.

3. **Add a safe credential diagnostic if needed**
   - If the code path looks correct, add or run a server-side-only diagnostic that tests the SAM.gov endpoint with the stored secret and logs only status/result metadata, never the key.

4. **Redeploy/retry the SAM sync function**
   - Redeploy the affected edge function if the deployed runtime may still be using a stale environment.
   - Re-run `/admin/sync` and verify the newest `sync_runs` row no longer reports the SAM 401.

5. **If SAM.gov still returns 401**
   - Treat it as a SAM.gov-side key issue: the key may be inactive, copied with whitespace, tied to the wrong SAM.gov account/environment, or not yet enabled for Opportunities API access.
   - Use the diagnostic result to give you the exact next action.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>