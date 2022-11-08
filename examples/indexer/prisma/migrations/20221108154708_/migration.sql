-- CreateTable
CREATE TABLE "Account" (
    "address" BLOB NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "toAddress" BLOB NOT NULL,
    "fromAddress" BLOB NOT NULL,
    CONSTRAINT "Transfer_toAddress_fkey" FOREIGN KEY ("toAddress") REFERENCES "Account" ("address") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromAddress_fkey" FOREIGN KEY ("fromAddress") REFERENCES "Account" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Token" (
    "id" BLOB NOT NULL PRIMARY KEY,
    "ownerAddress" BLOB NOT NULL,
    CONSTRAINT "Token_ownerAddress_fkey" FOREIGN KEY ("ownerAddress") REFERENCES "Account" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
);
