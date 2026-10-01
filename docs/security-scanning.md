# Production image security gate

The existing CI Docker job builds the final `runner` stage of `Dockerfile` on
pull requests to `main` and pushes to `main`, then scans the locally loaded image
tagged with the commit SHA. The target is the production Node/Next.js standalone
runtime, including its OS packages and shipped npm dependencies. Neither the
builder stage nor a source-tree scan substitutes for the runtime image scan.
GHCR login and publication happen only after a successful scan; the same loaded
image is pushed without rebuilding. Deployment depends on that job.

Trivy action v0.36.0 is pinned to commit
`ed142fd0673e97e23eac54620cfb913e5ce36c25`; the scanner is fixed at v0.70.0.
OS and application-library HIGH/CRITICAL findings fail CI, including findings
without fixes. Vulnerability tables appear in the job log and step summary even
when the gate fails. Only the vulnerability scanner runs, so reports do not
include secret contents. There is no ignore list or `ignore-unfixed` suppression.

Docker uses `npm ci` with the committed lockfile so runtime dependencies match
the versions checked in CI. The action caches vulnerability databases while
allowing Trivy to refresh them. CI logs record the image ID, scanner version,
and DB metadata. Findings can change as upstream advisories change. For exact
historical reproduction, retain the image (or immutable digest), scanner version,
and DB cache with its metadata. Do not permanently freeze an old DB in CI.
Docker base tags are refreshed at build time with `pull`.

## Local verification

Using Trivy v0.70.0 and actionlint:

```sh
actionlint .github/workflows/ci.yml
docker build --pull -t tutorplatform-frontend:security .
trivy image --image-src docker --scanners vuln --pkg-types os,library \
  --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed=false \
  --timeout 10m tutorplatform-frontend:security
```

If an upstream finding cannot be patched in this change, record the CVE, package,
installed/fixed versions, upstream link, and why an upgrade must be separate.
Any proposed exception must be scoped to that CVE and package path, include an
owner and expiry, and retain visibility in a separate unfiltered report.
Do not add a global severity bypass or blanket unfixed-vulnerability suppression.

## Initial baseline (2026-10-01)

The old `npm install` build resolved newer dependencies and had no HIGH/CRITICAL
findings. Building the committed lockfile with `npm ci` exposed the CRITICAL
[GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)
in the standalone runtime's Next.js 16.3.5. Update Next.js and its matching
`eslint-config-next` to 16.3.6 and commit the corresponding lockfile changes.
The production gate checks the packages actually shipped in the standalone
image; development/build dependencies remain outside that image. No allow-list
is needed.
