BEGIN DATABASE CONTEXT PROMPT

You must read, parse and understand the following PostgreSQL database schema.
This schema is provided for context only and must not be executed.
Interpret it as a description of entities, fields, primary keys, foreign keys, constraints and relationships.

GENERAL RULES

All id_* fields are numeric identifiers.

created_at exists in all tables and is not relevant unless explicitly requested.

is_deleted fields represent soft-deletion.

is_active fields represent activation status.

uuid_auth links app users to authentication provider.

Consider this schema as the source of truth for all future queries, API designs, and reasoning.

📌 DATABASE SCHEMA (Normalized Structure)
Table: diet

id_diet (PK)

created_at

kCal

id_user_details (FK → user_details.id_user_details)

Table: exercises_list

id_exercise_list (PK)

created_at

is_deleted

name

description

link_video

id_muscolar_group

Table: personal_trainer

id_personal_trainer (PK, UNIQUE)

created_at

is_deleted

is_active

id_user_detail (FK → user_details.id_user_details)

Table: program

id_program (PK, UNIQUE)

created_at

is_deleted

id_user_details (FK → user_details.id_user_details)

number_program

date_start_program

number_days_workout

duration_workout

id_personal_trainer (FK → personal_trainer.id_personal_trainer)

is_active

description

created_by (FK → personal_trainer.id_personal_trainer)

assigned_to (FK → user_details.id_user_details)

Table: program_weeks

id_program_week (PK)

created_at

id_program (FK → program.id_program)

week_number

is_active

is_deleted

Table: program_days

id_program_day (PK)

created_at

id_program_week (FK → program_weeks.id_program_week)

day_number

name

notes

Table: reps_types

id_reps_type (PK)

created_at

is_deleted

name

description

key

is_active

Table: user_details

id_user_details (PK, UNIQUE)

created_at

name

surname

birthday

is_deleted

uuid_auth (UNIQUE)

email

user_details_type

id_personal_trainer (FK → personal_trainer.id_personal_trainer)

Table: user_settings

id_user_setting (PK)

created_at

theme

color

id_user_detail (FK → user_details.id_user_details)

Table: workout_day_exercises

id_workout_day_exercise (PK)

created_at

id_program_day (FK → program_days.id_program_day)

id_exercise_list (FK → exercises_list.id_exercise_list)

order

sets

id_reps_type (FK → reps_types.id_reps_type)

reps_min

reps_max

rest_time

target_load

id_program_exercise_group_intensity (FK → workout_exercise_group_intensity.id_workout_exercise_group_intensity)

is_deleted

Table: workout_exercise_group_intensity

id_workout_exercise_group_intensity (PK)

created_at

id_workout_day_exercise (FK → workout_day_exercises.id_workout_day_exercise)

id_intensity_type

note

number_sets

Table: workout_exercise_set

id_workout_exercise_set (PK)

created_at

id_workout_day_exercises (FK → workout_day_exercises.id_workout_day_exercise)

set_number

load

reps

intensity

rpe (1–10)

execution_rating (1–3)

synced

modified_at

notes

END OF SCHEMA

Acknowledge that you understand and store this schema as context for the current conversation.
Be ready to answer questions, generate queries, validate logic, or propose API structures based on these database relations.

END DATABASE CONTEXT PROMPT