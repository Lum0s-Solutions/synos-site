# Command Injection

Command injection is a vulnerability in which an application passes unsanitized user input into a system shell, allowing an attacker to execute arbitrary operating-system commands in the application's context. It typically arises when applications build shell commands from user-controlled data without proper validation or escaping. Prevention relies on avoiding shell calls, using parameterized APIs, and applying strict input validation.

> Part of [[cybersecurity-MOC]]

## Mentioned in
```dataview
LIST
FROM [[]]
SORT file.name
```

## 🎴 Review
<!-- Spaced Repetition cards -->
#flashcards/security-plus

What is command injection?::A vulnerability where an app passes unsanitized user input into a system shell, letting an attacker execute arbitrary OS commands in the app's context.

When does command injection typically arise?::When applications build shell commands from user-controlled data without proper validation or escaping.

How is command injection prevented?::Avoiding shell calls, using parameterized APIs, and applying strict input validation.
