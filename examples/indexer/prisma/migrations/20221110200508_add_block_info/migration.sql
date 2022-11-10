/*
  Warnings:

  - Added the required column `blockHash` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenId` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionHash` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Block" (
    "hash" BLOB NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "toAddress" BLOB NOT NULL,
    "fromAddress" BLOB NOT NULL,
    "tokenId" BLOB NOT NULL,
    "transactionHash" BLOB NOT NULL,
    "blockHash" BLOB NOT NULL,
    CONSTRAINT "Transfer_toAddress_fkey" FOREIGN KEY ("toAddress") REFERENCES "Account" ("address") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromAddress_fkey" FOREIGN KEY ("fromAddress") REFERENCES "Account" ("address") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_blockHash_fkey" FOREIGN KEY ("blockHash") REFERENCES "Block" ("hash") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transfer" ("fromAddress", "id", "toAddress") SELECT "fromAddress", "id", "toAddress" FROM "Transfer";
DROP TABLE "Transfer";
ALTER TABLE "new_Transfer" RENAME TO "Transfer";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
