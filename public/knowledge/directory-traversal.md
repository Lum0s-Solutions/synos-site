# Directory Traversal

Directory traversal (path traversal) is a web vulnerability that lets an attacker access files and directories outside the intended web root by manipulating file-path input with sequences such as `../`. Successful exploitation can expose sensitive files like /etc/passwd, configuration files, credentials, or source code. It is mitigated through input validation, path canonicalization, and least-privilege file access.

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

What is directory traversal (path traversal)?::A web vulnerability that lets an attacker access files outside the intended web root by manipulating file-path input with sequences such as ../.

What can successful directory traversal expose?::Sensitive files like /etc/passwd, configuration files, credentials, or source code.

How is directory traversal mitigated?::Input validation, path canonicalization, and least-privilege file access.
