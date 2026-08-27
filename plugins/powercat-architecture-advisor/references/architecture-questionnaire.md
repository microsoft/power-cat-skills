# Power Platform Architecture Discovery Questionnaire

Use this questionnaire to gather requirements before producing an architecture recommendation.
Fields marked with [Required] must be answered before final recommendations are generated.

## Use Case Requirement

- [Required] What business problem are you trying to solve?
- What is the priority of this solution?
- What benefits do you anticipate after building this solution?
- [Required] Do you have any existing application for this? If yes, do you plan for data migration?
- [Required] What is the nature and sensitivity of the data used in this solution?
- Will the solution require offline connectivity or can users face network problems?
- Are there any geographical dependencies (for example, GDPR)?
- Are there any organizational initiatives to consider (for example, API First, Low Code First)?
- [Required] Do you have developers or partners to develop the solution?

## User Experience

- [Required] What does data entry look like from a user experience perspective?
- [Required] Is this solution mainly for C-Suite executives focused on reports and data analytics?
- What device format will be most used?
- Are your users internal, external, or both?
- Are there any accessibility needs to consider?
- Is this solution primarily designed for field workers?
- [Required] How do you want users to visualize the data?
- [Required] Do you want users to have the capability to create their own reports?
- What is the level of complexity in the runtime logic that processes data in your Canvas App?

## Solution Ownership

- [Required] Have you identified a clear owner for the long-term maintenance of the app?
- [Required] Have a RACI (Responsible, Accountable, Consulted, Informed) chart to distinguish roles and responsibilities of IT, App Owner, and Business Units.

## Data Model and Storage

- [Required] What is the current size of the database, and how many rows of data do you currently have?
- How many tables will your solution interact with, and do you have an existing data model and ERD (Entity Relationship Diagram)?
- [Required] What data source will you use, and is it appropriate for your data's size, complexity, and nature?
- Do you have a master dataset that must be utilized, and are any Data Sharing Agreements required with other business units?
- [Required] Are there any data integrations with other systems, and do you need to export data to another system like a Data Warehouse?
- Are there any required integrations with external systems, and what are the associated security or network considerations?
- Is the data normalized or denormalized according to the app's needs?
- What is the anticipated data growth per month or year?
- What are your Business Continuity plans?

## Data Management

- [Required] What are your data validation requirements to ensure integrity and consistency?
- [Required] How do you ensure schema changes are not made in the production environment?
- [Required] Have you reviewed API throttling limits documentation and considered its impact on the solution?
- [Required] Are you handling unexpected errors or system failures, and are error messages actionable and informative?
- [Required] Do you plan to use User Data Audits, and how do you manage and monitor app usage?

## Security

- [Required] How do you manage user access to this solution?
- Where do you plan to publish the app, and what is the encryption setting for this environment?
- Does your solution adhere to your company's Data Loss Policy (DLP) and Customer Managed Keys (CMK) policies?
- Are you effectively handling personal and sensitive information with encryption and role-based access?
- How will you ensure secure storage of API keys and OAuth tokens?
- [Required] What is the current security status of both external and internal APIs?
- [Required] What is your plan for ensuring the app stays in compliance, and how do you define compliance?
- Do you need to work with your cybersecurity team for a release?

## Application Lifecycle Management and Change Management

- [Required] Do you have a plan for documenting solution artifacts, features, and functionality?
- [Required] What tool are you planning to use for deployment?
- How will you ensure the solution is easy to maintain?
- How will you ensure code reusability to avoid duplication?
- What type of account do you plan to use for deploying solutions?
- What is your rollback plan in case of major issues?
- How are resources published and made available to makers and users?
- How often do you remind app owners to refactor or republish their apps with the latest features?
- How will you capture and prioritize user feedback, and plan for handling bugs and user support?
