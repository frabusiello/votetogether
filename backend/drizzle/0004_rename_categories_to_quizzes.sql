ALTER TABLE "categories" RENAME TO "quizzes";--> statement-breakpoint
ALTER SEQUENCE "categories_id_seq" RENAME TO "quizzes_id_seq";--> statement-breakpoint
ALTER TABLE "quizzes" RENAME CONSTRAINT "categories_pkey" TO "quizzes_pkey";--> statement-breakpoint
ALTER TABLE "quizzes" RENAME CONSTRAINT "categories_slug_unique" TO "quizzes_slug_unique";--> statement-breakpoint
ALTER TABLE "items" RENAME COLUMN "category_id" TO "quiz_id";--> statement-breakpoint
ALTER TABLE "games" RENAME COLUMN "category_id" TO "quiz_id";--> statement-breakpoint
ALTER TABLE "items" RENAME CONSTRAINT "items_category_id_categories_id_fk" TO "items_quiz_id_quizzes_id_fk";--> statement-breakpoint
ALTER TABLE "games" RENAME CONSTRAINT "games_category_id_categories_id_fk" TO "games_quiz_id_quizzes_id_fk";--> statement-breakpoint
ALTER INDEX "items_category_id_idx" RENAME TO "items_quiz_id_idx";
