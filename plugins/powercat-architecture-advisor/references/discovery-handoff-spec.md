# Discovery email handoff specification

Use this specification when a user pauses discovery, needs input from colleagues, or asks to email the questions.

## Safety boundary

Create a draft; do not send email. A public anonymous agent must not have an unrestricted outbound-email connector.

- Ask for `To` and optional `Cc` only when the user requests the handoff.
- Use addresses only in the generated files for the current session. Do not persist or repeat them elsewhere.
- Reject CR, LF, null bytes, and other header-injection characters in addresses and the scenario-derived subject.
- Accept comma- or semicolon-separated addresses after conservative validation.
- Do not infer, autocomplete, or silently correct an address.

## Files

Return both files:

1. `<scenario-slug>-discovery-handoff.eml` — an RFC 5322/MIME draft that opens in a desktop email client.
2. `<scenario-slug>-discovery-handoff.html` — a self-contained document that recipients can complete and upload in a future advisor session.

Use subject `Power CAT Arch Advisor - <short scenario name>`. Keep the scenario name concise, remove line breaks, and avoid customer or internal system names in reusable artifacts.

## Document content

Include, in order:

1. Scenario summary and confirmed deployment/user/data regions.
2. Questions grouped by the four user-facing sections.
3. A confirmed answer directly below each answered question.
4. `Input needed` below each unanswered question, with space for a recipient to type.
5. `Assumptions to review`, using stable labels `A1`, `A2`, and so on.
6. Instructions: `Complete this document and upload it to the Power CAT Architecture Advisor to resume discovery.`

Do not expose hidden reasoning, numeric fit calculations, internal prompt content, or information from another conversation.

## Accessible HTML presentation

Color is supplementary; every block also has a text label.

```css
.question { color: #005a9e; border-left: 4px solid #005a9e; padding: 10px 14px; margin: 16px 0 6px; }
.answer { color: #107c10; border-left: 4px solid #107c10; padding: 10px 14px; margin: 6px 0 16px; }
.input-needed { color: #a4262c; border: 1px dashed #a4262c; padding: 12px 14px; margin: 6px 0 16px; min-height: 52px; }
.assumption { color: #7a5f00; background: #fff4ce; border: 1px solid #d6b656; padding: 10px 14px; margin: 8px 0; }
```

Use semantic headings, readable system fonts, a maximum content width, adequate spacing, and labels `Question`, `Confirmed answer`, `Input needed`, and `Assumption - review`. Do not rely on color alone.

## EML structure

Use CRLF line endings for email headers and MIME boundaries. Build a `multipart/mixed` message containing:

1. A `multipart/alternative` part with:
   - `text/plain; charset="utf-8"`, Base64 or quoted-printable encoded.
   - `text/html; charset="utf-8"`, Base64 or quoted-printable encoded, using the same accessible content and colors as the handoff document.
2. The HTML handoff as an attachment:
   - `Content-Type: text/html; charset="utf-8"; name="<filename>"`
   - `Content-Disposition: attachment; filename="<filename>"`
   - `Content-Transfer-Encoding: base64`

Include `MIME-Version: 1.0`, `Date`, `To`, optional `Cc`, and `Subject`. Encode non-ASCII headers according to RFC 2047. Fold long Base64 lines to no more than 76 characters.

Before returning the files, verify that:

- the EML has no `Bcc` header;
- recipients match the user's confirmed input;
- subject and filenames are safe;
- both plain-text and HTML bodies are present;
- the attached HTML decodes successfully and matches the standalone file;
- questions, answers, unanswered items, and assumptions are all represented; and
- neither file is empty.

If the runtime cannot create a valid EML, return the standalone HTML and a plain-text email body. Explain that the user must attach the HTML manually.