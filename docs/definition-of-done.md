# Definition of Done

This document defines when a user story, task, or pull request is considered done in this project.

A task is only considered done when the implementation is complete, tested, reviewed, documented, and merged after approval.

## General Rule

A task is **done** when:

- the agreed functionality is implemented
- the expected behavior is documented
- the code has been tested
- relevant bugs have been handled
- the pull request has been reviewed by at least two people
- the project owner has been consulted before merging
- the changes have been merged into the main branch

## Documentation

Documentation must be updated whenever a task changes functionality, architecture, API behavior, data structures, or user-visible behavior.

Documentation should include:

- what the feature does
- how the feature is used
- relevant input and output formats
- expected behavior of important functions
- edge cases that should be considered
- information needed for future unit or integration tests

For functions or API endpoints, documentation should describe:

- expected input
- expected output
- error cases
- important assumptions
- examples where useful


## Code Quality

Code should be understandable, maintainable, and consistent with the existing project structure.

Before a task can be considered done:

- the code must be readable and clearly structured
- variable, function, and file names should be meaningful
- unused code, debug output, and unnecessary comments should be removed
- the implementation should fit into the existing frontend/backend architecture
- no unrelated changes should be included in the pull request

## Testing

Every task should be tested before it is merged.

Testing can include:

- manual testing
- unit testing where useful
- integration testing for connected functionality
- API testing where backend behavior is involved
- frontend testing where user interface behavior is involved

Integration testing is especially important when a feature connects multiple parts of the system, for example:

- frontend and backend communication
- loading JSON datasets
- displaying privacy risk levels in the UI
- creating or reading project data
- authentication-related behavior

Testing notes should be included in the pull request description.

## Bugs

Known bugs must be handled before a task is considered done.

For each bug, the team should decide whether:

- the bug must be fixed before merging
- the bug can be accepted temporarily
- the bug should be documented as a follow-up issue

Bugs that affect core functionality, data correctness, security, privacy, or the user story acceptance criteria should be fixed before merging.

Minor bugs that are difficult to fix immediately may be postponed if:

- the team agrees
- the project owner is informed if necessary
- the bug is documented as a follow-up issue
- the bug does not block the agreed user story

## Review

Every pull request must be reviewed before it is merged.

A pull request is ready for merging only when:

- at least two team members have reviewed it
- review comments have been resolved
- the code has been tested
- documentation has been updated if needed
- the pull request description explains the changes
- the related user story or issue is referenced


## Project Owner Approval

Before a completed task is merged, the team should talk to the project owner when the change affects:

- user story scope
- expected user behavior
- privacy risk logic
- dataset structure
- acceptance criteria
- major technical decisions

The result of this discussion should be reflected in the issue, pull request, or documentation if it changes the agreed scope.

## Merge

The final result of a done task is a merge into the main branch.

Before merging:

- all required reviews must be completed
- relevant tests must pass
- important bugs must be fixed or documented
- documentation must be complete
- the project owner must have been consulted when needed

## Checklist

A task can be marked as done when all applicable items are checked:

- [ ] The implementation satisfies the user story or task description.
- [ ] Acceptance criteria are fulfilled.
- [ ] Input and output behavior is documented where relevant.
- [ ] Expected behavior for future tests is documented.
- [ ] Code is readable and follows the project structure.
- [ ] Unused code and debug output have been removed.
- [ ] Manual testing was performed.
- [ ] Integration testing was performed where relevant.
- [ ] Unit tests were added where useful.
- [ ] Bugs were fixed or documented as follow-up issues.
- [ ] The pull request was reviewed by at least two people.
- [ ] Review comments were resolved.
- [ ] The project owner was consulted before merging when needed.
- [ ] The pull request was merged into the main branch.