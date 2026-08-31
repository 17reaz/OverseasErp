# Label Configuration for OverseasErp

## Issue Types (mutually exclusive)
- `bug`: Something isn't working (Red)
- `enhancement`: New feature or request (Green)
- `task`: Work item/refactoring (Blue)
- `documentation`: Documentation improvements (Purple)

## Priority
- `critical`: System down, security risk, data loss
- `high`: Significant impact on users
- `medium`: Normal priority
- `low`: Nice to have, minor improvements

## Status
- `needs-triage`: Unreviewed, needs assessment
- `in-progress`: Someone is actively working
- `blocked`: Blocked by something else
- `needs-review`: PR/work ready for review
- `backlog`: Accepted but not started
- `wontfix`: Intentionally not fixing

## Component
- `api`: Backend/API changes
- `ui`: Frontend/UI changes
- `database`: Database/data model
- `auth`: Authentication/authorization
- `performance`: Performance optimization
- `docs`: Documentation

## Size (for estimation)
- `size/xs`: Small (< 2 hours)
- `size/s`: Small (2-4 hours)
- `size/m`: Medium (4-8 hours)
- `size/l`: Large (8-16 hours)
- `size/xl`: Extra large (> 16 hours)

## Effort
- `effort/frontend`: Primarily frontend work
- `effort/backend`: Primarily backend work
- `effort/full-stack`: Both frontend and backend

## Quick Help
- `good-first-issue`: Good for new contributors
- `help-wanted`: Need assistance
- `feedback-wanted`: Seeking community input

## Testing
- `needs-test`: Requires test coverage
- `test-included`: Tests already included

To apply these labels to your GitHub repo, you can use the CLI:

```bash
gh label create "bug" --color "FF0000" --description "Something isn't working"
gh label create "enhancement" --color "00FF00" --description "New feature or request"
gh label create "task" --color "0000FF" --description "Work item or refactoring"
gh label create "critical" --color "FF6600" --description "System down, security, data loss"
# ... etc for other labels
```

Or manage them through GitHub Settings > Labels interface.
