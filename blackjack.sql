-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 19, 2026 at 01:54 PM
-- Server version: 10.11.14-MariaDB-0+deb12u2
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `blackjack`
--

-- --------------------------------------------------------

--
-- Table structure for table `code`
--

CREATE TABLE `code` (
  `id` int(11) NOT NULL,
  `code` varchar(255) NOT NULL,
  `cash` int(11) NOT NULL DEFAULT 0,
  `coins` int(11) NOT NULL DEFAULT 0,
  `usageCount` int(11) NOT NULL DEFAULT 0,
  `isActive` int(11) NOT NULL DEFAULT 0,
  `expiredDate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedBy` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `codeHistory`
--

CREATE TABLE `codeHistory` (
  `id` int(11) NOT NULL,
  `codeId` int(11) NOT NULL DEFAULT 0,
  `userId` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedBy` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gameHistory`
--

CREATE TABLE `gameHistory` (
  `id` int(11) NOT NULL,
  `userId1` int(11) NOT NULL DEFAULT 0,
  `userId2` int(11) NOT NULL DEFAULT 0,
  `result` varchar(255) NOT NULL,
  `mode` varchar(255) NOT NULL,
  `bet` int(11) NOT NULL DEFAULT 0,
  `reward` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedBy` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL DEFAULT 0,
  `receiptRef` varchar(255) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 0,
  `currencyType` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedBy` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `cash` int(11) NOT NULL DEFAULT 0,
  `coins` int(11) NOT NULL DEFAULT 0,
  `isVerified` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedBy` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `userSkin`
--

CREATE TABLE `userSkin` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL DEFAULT 0,
  `skinId` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updatedBy` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `code`
--
ALTER TABLE `code`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_code` (`code`);

--
-- Indexes for table `codeHistory`
--
ALTER TABLE `codeHistory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_code_user` (`codeId`,`userId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `gameHistory`
--
ALTER TABLE `gameHistory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId1` (`userId1`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_receipt` (`receiptRef`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_email` (`email`);

--
-- Indexes for table `userSkin`
--
ALTER TABLE `userSkin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `code`
--
ALTER TABLE `code`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `codeHistory`
--
ALTER TABLE `codeHistory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gameHistory`
--
ALTER TABLE `gameHistory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `userSkin`
--
ALTER TABLE `userSkin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `codeHistory`
--
ALTER TABLE `codeHistory`
  ADD CONSTRAINT `codeHistory_ibfk_1` FOREIGN KEY (`codeId`) REFERENCES `code` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `codeHistory_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gameHistory`
--
ALTER TABLE `gameHistory`
  ADD CONSTRAINT `gameHistory_ibfk_1` FOREIGN KEY (`userId1`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `userSkin`
--
ALTER TABLE `userSkin`
  ADD CONSTRAINT `userSkin_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
