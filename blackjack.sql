-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 05, 2026 at 03:16 PM
-- Server version: 10.11.14-MariaDB-0+deb12u2
-- PHP Version: 8.2.30

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
  `amount` int(11) NOT NULL DEFAULT 0,
  `type` varchar(255) NOT NULL,
  `maxUses` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 0,
  `expiredDate` datetime NOT NULL DEFAULT current_timestamp(),
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `package`
--

CREATE TABLE `package` (
  `packageId` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `tokens` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'user',
  `tokens` int(11) NOT NULL DEFAULT 0,
  `coins` int(11) NOT NULL DEFAULT 1000,
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `email`, `password`, `role`, `tokens`, `coins`, `isVerified`, `createdAt`, `updatedAt`) VALUES
(1, 'bot', 'mail@example.com', 'Null', 'system', 0, 0, 0, '2026-02-20 13:36:58', '2026-02-20 22:05:22'),
(11, 'petergamez', 'chanakan.kea@gmail.com', '$2a$12$dnGshw6bEEmekXKG949T.edQNW.GOjuAuyB2G3wP1RpmXYvFxuATu', 'admin', 1000, 2030, 1, '2026-02-20 13:50:13', '2026-03-05 13:17:54'),
(12, 'test1', 'test1@test.com', '$2b$12$Q9nCsnsEzyB./qTDPEa17eBrM2iKcWa0lIP2hVAc4JAhy/cQQIpnS', 'user', 1000, 0, 0, '2026-02-28 14:10:25', '2026-02-28 17:11:45'),
(13, 'test_eng', 'intouch.n@ku.th', '$2b$12$5z34.8M10vlC7PUMPAQoVOaQ3WAjL4c2AxAx4IwvtgtUkr1R3Kr/.', 'user', 1000, 204527, 1, '2026-02-28 14:19:50', '2026-03-05 14:04:09'),
(14, 'lucifer', 'engkungpvp@gmail.com', '$2b$12$v.adcg7Qvm7x1Ctq8Z.OGux9uKWNppgRjmqFSAKd3cmzJHTz.2eiy', 'user', 0, 1295, 1, '2026-02-28 17:28:21', '2026-03-05 00:59:18'),
(15, 'peak', 'slaaxx1122@gmail.com', '$2b$12$q10LdVUcijuYbE/XXNg3VOI7JpUCOuIHiLHQ7tpU/fIR64bcLQZUS', 'user', 0, 1010, 1, '2026-02-28 17:30:23', '2026-02-28 17:31:05'),
(16, 'kkk', 'poomipadunsan@gmail.com', '$2b$12$f8.S1u.yDYUGCNKo4ADV7OPK04I7eqFjDEbjGDcFOMRk3eqfLRkk.', 'user', 0, 1010, 1, '2026-02-28 17:50:28', '2026-02-28 17:52:56'),
(17, 'test_eng2', 'coaeng9632@gmail.com', '$2b$12$izQ8Q.Mjgla5/dZnRtFvfOUBXciYPv27JJzDWECmYhPxUmvjSBNk.', 'user', 0, 2010, 1, '2026-03-03 15:31:43', '2026-03-03 15:38:56'),
(19, 'qwerty', 'hareyth@gmail.com', '$2a$12$AnIqH76VzRa9ZGs9gDdnse5CHRSa6UT1XJ60kVOQOwn0Eq2VWtn7m', 'user', 0, 1000, 1, '2026-03-03 20:02:38', '2026-03-03 20:04:47'),
(20, 'hakari', 'moneys2548@gmail.com', '$2b$12$fNu2.KGIcYgfEoRoCuS11uX9wYYWEOfDGD570GMJFiFblwMJ5KPUW', 'user', 0, 0, 1, '2026-03-04 16:13:14', '2026-03-05 13:47:38'),
(21, 'stellaz', 'piraya.phue@ku.th', '$2b$12$be..2jm5F57O9Ms4nwQve.2OzPw3ONwE8hfMJxsx2ONjL/4cqU3/O', 'user', 0, 1010, 1, '2026-03-05 00:44:58', '2026-03-05 13:14:54'),
(22, 'f', 'chayodom.c@ku.th', '$2b$12$PCVZ2bRt.0.OaWdxCsuzM.gBwuoVZA5nYv66MHMUK2bUF4jX1A5GK', 'user', 0, 1000, 0, '2026-03-05 13:55:37', '2026-03-05 13:55:37');

-- --------------------------------------------------------

--
-- Table structure for table `userSkin`
--

CREATE TABLE `userSkin` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL DEFAULT 0,
  `skinId` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `code`
--
ALTER TABLE `code`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `codeHistory`
--
ALTER TABLE `codeHistory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gameHistory`
--
ALTER TABLE `gameHistory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `package`
--
ALTER TABLE `package`
  ADD PRIMARY KEY (`packageId`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `userSkin`
--
ALTER TABLE `userSkin`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `userSkin`
--
ALTER TABLE `userSkin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
