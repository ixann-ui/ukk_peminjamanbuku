-- Migration to add page_count column to books table
ALTER TABLE `books` 
ADD COLUMN `page_count` INT(11) DEFAULT NULL;