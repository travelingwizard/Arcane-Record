# Module Registry API v1

Base path: `/v1`. Public responses are JSON except immutable module downloads.
Authenticated requests use `Authorization: Bearer <short-lived EdDSA JWT>`.
The service does not use cookies.

| Method | Path                                    | Access         | Purpose                                      |
| ------ | --------------------------------------- | -------------- | -------------------------------------------- |
| GET    | `/health`                               | Public         | Process/storage readiness                    |
| GET    | `/catalog`                              | Public         | Published metadata and recommended pointers  |
| GET    | `/modules/:moduleId/:version`           | Public         | Immutable canonical module bytes             |
| POST   | `/stages`                               | Publisher      | Validate and quarantine a namespace version  |
| GET    | `/stages/:stageId`                      | Owner/reviewer | Inspect exact staged bytes and checksum      |
| POST   | `/stages/:stageId/approve`              | Reviewer       | Publish the submitted exact checksum         |
| POST   | `/stages/:stageId/reject`               | Reviewer       | Reject with a reason                         |
| POST   | `/modules/:moduleId/:version/deprecate` | Admin + MFA    | Append deprecation metadata                  |
| POST   | `/modules/:moduleId/rollback`           | Admin + MFA    | Move recommended pointer to existing version |
| POST   | `/tokens/:tokenId/revoke`               | Admin + MFA    | Revoke a token ID                            |

Downloads include `ETag`, `Digest`, immutable caching, `nosniff`, and attachment
disposition. Error bodies contain a generic message and request ID. Mutation
audit events record request ID, actor, action, namespace/version/checksum where
applicable, outcome, and timestamp—never character or draft data.
