-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 29, 2026 at 01:33 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `eventfairsys`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int NOT NULL,
  `userId` int DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `module` varchar(255) NOT NULL,
  `details` text,
  `ipAddress` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `userId`, `action`, `module`, `details`, `ipAddress`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-20 09:24:17', '2026-10-20 09:24:17'),
(2, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-20 17:15:06', '2026-10-20 17:15:06'),
(3, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-20 17:16:34', '2026-10-20 17:16:34'),
(4, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-20 21:52:48', '2026-10-20 21:52:48'),
(5, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-21 00:08:45', '2026-10-21 00:08:45'),
(6, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-21 00:09:19', '2026-10-21 00:09:19'),
(7, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-21 00:09:56', '2026-10-21 00:09:56'),
(8, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-21 00:22:09', '2026-10-21 00:22:09'),
(9, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-21 00:22:27', '2026-10-21 00:22:27'),
(10, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-21 00:23:00', '2026-10-21 00:23:00'),
(11, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-21 00:23:39', '2026-10-21 00:23:39'),
(12, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-21 00:24:08', '2026-10-21 00:24:08'),
(13, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-21 00:24:47', '2026-10-21 00:24:47'),
(14, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-21 00:27:59', '2026-10-21 00:27:59'),
(15, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-21 00:28:54', '2026-10-21 00:28:54'),
(16, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-22 00:57:56', '2026-10-22 00:57:56'),
(17, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-26 13:26:29', '2026-10-26 13:26:29'),
(18, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:27:31', '2026-10-26 13:27:31'),
(19, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-26 13:27:36', '2026-10-26 13:27:36'),
(20, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:27:46', '2026-10-26 13:27:46'),
(21, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-26 13:27:53', '2026-10-26 13:27:53'),
(22, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:28:17', '2026-10-26 13:28:17'),
(23, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-26 13:28:31', '2026-10-26 13:28:31'),
(24, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-26 13:31:23', '2026-10-26 13:31:23'),
(25, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:32:24', '2026-10-26 13:32:24'),
(26, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-26 13:41:01', '2026-10-26 13:41:01'),
(27, 2, 'Created event', 'Events', 'Miss Teen Bansud', '::1', '2026-10-26 13:42:03', '2026-10-26 13:42:03'),
(28, 2, 'Created category', 'Competition Categories', 'Production Number · Miss Teen Bansud', '::1', '2026-10-26 13:43:42', '2026-10-26 13:43:42'),
(29, 2, 'Created judging criterion', 'Judging Criteria', 'Awra · Miss Teen Bansud', '::1', '2026-10-26 13:46:09', '2026-10-26 13:46:09'),
(30, 2, 'Assigned official', 'Assignments', 'judge@eventfair.local to Miss Teen Bansud', '::1', '2026-10-26 13:46:26', '2026-10-26 13:46:26'),
(31, 2, 'Assigned official', 'Assignments', 'tabulator@eventfair.local to Miss Teen Bansud', '::1', '2026-10-26 13:46:31', '2026-10-26 13:46:31'),
(32, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:46:42', '2026-10-26 13:46:42'),
(33, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-26 13:46:48', '2026-10-26 13:46:48'),
(34, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:47:01', '2026-10-26 13:47:01'),
(35, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-26 13:47:10', '2026-10-26 13:47:10'),
(36, 2, 'Registered contestant', 'Contestants', '1', '::1', '2026-10-26 13:47:29', '2026-10-26 13:47:29'),
(37, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:47:32', '2026-10-26 13:47:32'),
(38, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-26 13:47:36', '2026-10-26 13:47:36'),
(39, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:48:02', '2026-10-26 13:48:02'),
(40, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-26 13:48:07', '2026-10-26 13:48:07'),
(41, 2, 'Updated event', 'Events', 'Miss Teen Bansud', '::1', '2026-10-26 13:48:16', '2026-10-26 13:48:16'),
(42, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:48:18', '2026-10-26 13:48:18'),
(43, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-26 13:48:23', '2026-10-26 13:48:23'),
(44, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:48:51', '2026-10-26 13:48:51'),
(45, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-26 13:48:55', '2026-10-26 13:48:55'),
(46, 2, 'Updated event', 'Events', 'Miss Teen Bansud', '::1', '2026-10-26 13:49:40', '2026-10-26 13:49:40'),
(47, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:49:44', '2026-10-26 13:49:44'),
(48, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-26 13:49:48', '2026-10-26 13:49:48'),
(49, 3, 'Saved draft scores', 'Score Entry', 'Event 1, contestant 1', '::1', '2026-10-26 13:50:32', '2026-10-26 13:50:32'),
(50, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:50:43', '2026-10-26 13:50:43'),
(51, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-26 13:50:49', '2026-10-26 13:50:49'),
(52, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-26 13:51:04', '2026-10-26 13:51:04'),
(53, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-26 13:51:08', '2026-10-26 13:51:08'),
(54, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::ffff:127.0.0.1', '2026-10-27 02:37:54', '2026-10-27 02:37:54'),
(55, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::ffff:127.0.0.1', '2026-10-27 02:38:17', '2026-10-27 02:38:17'),
(56, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::ffff:127.0.0.1', '2026-10-27 02:39:01', '2026-10-27 02:39:01'),
(57, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::ffff:127.0.0.1', '2026-10-27 02:39:11', '2026-10-27 02:39:11'),
(58, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 02:41:11', '2026-10-27 02:41:11'),
(59, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::ffff:127.0.0.1', '2026-10-27 02:42:44', '2026-10-27 02:42:44'),
(60, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 02:43:51', '2026-10-27 02:43:51'),
(61, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 02:48:13', '2026-10-27 02:48:13'),
(62, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 02:48:27', '2026-10-27 02:48:27'),
(63, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-27 02:50:27', '2026-10-27 02:50:27'),
(64, 2, 'Registered contestant', 'Contestants', '2', '::1', '2026-10-27 02:51:15', '2026-10-27 02:51:15'),
(65, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 02:51:18', '2026-10-27 02:51:18'),
(66, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-27 02:51:23', '2026-10-27 02:51:23'),
(67, 3, 'Saved draft scores', 'Score Entry', 'Event 1, contestant 2', '::1', '2026-10-27 02:52:31', '2026-10-27 02:52:31'),
(68, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 02:52:38', '2026-10-27 02:52:38'),
(69, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-27 02:52:43', '2026-10-27 02:52:43'),
(70, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::ffff:127.0.0.1', '2026-10-27 02:55:11', '2026-10-27 02:55:11'),
(71, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::ffff:127.0.0.1', '2026-10-27 02:55:18', '2026-10-27 02:55:18'),
(72, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-27 02:56:01', '2026-10-27 02:56:01'),
(73, 4, 'Generated tabulation report', 'Tabulation Reports', 'Final · Miss Teen Bansud', '::1', '2026-10-27 02:56:31', '2026-10-27 02:56:31'),
(74, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-27 03:01:44', '2026-10-27 03:01:44'),
(75, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-27 03:08:47', '2026-10-27 03:08:47'),
(76, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 03:09:25', '2026-10-27 03:09:25'),
(77, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-27 03:09:30', '2026-10-27 03:09:30'),
(78, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 03:09:52', '2026-10-27 03:09:52'),
(79, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-27 03:09:58', '2026-10-27 03:09:58'),
(80, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 03:10:26', '2026-10-27 03:10:26'),
(81, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-27 03:10:32', '2026-10-27 03:10:32'),
(82, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 03:10:53', '2026-10-27 03:10:53'),
(83, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-27 03:10:57', '2026-10-27 03:10:57'),
(84, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-27 04:25:33', '2026-10-27 04:25:33'),
(85, 2, 'Created judging criterion', 'Judging Criteria', 'Posture · Miss Teen Bansud', '::1', '2026-10-27 04:26:59', '2026-10-27 04:26:59'),
(86, 2, 'Created judging criterion', 'Judging Criteria', 'Costume · Miss Teen Bansud', '::1', '2026-10-27 04:27:29', '2026-10-27 04:27:29'),
(87, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 04:27:40', '2026-10-27 04:27:40'),
(88, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-27 04:27:48', '2026-10-27 04:27:48'),
(89, 3, 'Submitted scores', 'Score Entry', 'Event 1, contestant 1', '::1', '2026-10-27 04:28:25', '2026-10-27 04:28:25'),
(90, 3, 'Submitted scores', 'Score Entry', 'Event 1, contestant 2', '::1', '2026-10-27 04:28:44', '2026-10-27 04:28:44'),
(91, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 04:28:47', '2026-10-27 04:28:47'),
(92, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-27 04:28:51', '2026-10-27 04:28:51'),
(93, 4, 'Computed and verified rankings', 'Tabulation', 'Miss Teen Bansud · 2 contestants', '::1', '2026-10-27 04:28:59', '2026-10-27 04:28:59'),
(94, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-27 04:42:56', '2026-10-27 04:42:56'),
(95, 4, 'Generated tabulation report', 'Tabulation Reports', 'Final Results Report — Miss Teen Bansud · Miss Teen Bansud', '::1', '2026-10-27 04:43:25', '2026-10-27 04:43:25'),
(96, 4, 'Generated tabulation report', 'Tabulation Reports', 'Final Results Report — Miss Teen Bansud · Miss Teen Bansud', '::1', '2026-10-27 04:43:34', '2026-10-27 04:43:34'),
(97, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 04:44:21', '2026-10-27 04:44:21'),
(98, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 04:44:26', '2026-10-27 04:44:26'),
(99, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 04:44:52', '2026-10-27 04:44:52'),
(100, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 07:13:38', '2026-10-27 07:13:38'),
(101, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 07:17:06', '2026-10-27 07:17:06'),
(102, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 07:17:15', '2026-10-27 07:17:15'),
(103, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-27 07:20:16', '2026-10-27 07:20:16'),
(104, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-27 07:23:32', '2026-10-27 07:23:32'),
(105, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 07:58:36', '2026-10-27 07:58:36'),
(106, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 08:07:33', '2026-10-27 08:07:33'),
(107, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 08:10:15', '2026-10-27 08:10:15'),
(108, 1, 'Added homepage video', 'Website Content', 'hehe', '::1', '2026-10-27 08:10:39', '2026-10-27 08:10:39'),
(109, 1, 'Deleted homepage video', 'Website Content', 'hehe', '::1', '2026-10-27 08:11:20', '2026-10-27 08:11:20'),
(110, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 08:18:02', '2026-10-27 08:18:02'),
(111, NULL, 'Restored user account', 'Archive', 'Archive test 66630fb1-c1c1-44de-bbf0-a36de88fd03d', '127.0.0.1', '2026-10-27 08:21:20', '2026-10-27 08:21:20'),
(112, NULL, 'Restored event', 'Archive', 'Archive test 66630fb1-c1c1-44de-bbf0-a36de88fd03d', '127.0.0.1', '2026-10-27 08:21:20', '2026-10-27 08:21:20'),
(113, NULL, 'Restored system setting', 'Archive', 'archive_test_66630fb1-c1c1-44de-bbf0-a36de88fd03d', '127.0.0.1', '2026-10-27 08:21:20', '2026-10-27 08:21:20'),
(114, NULL, 'Restored homepage video', 'Archive', 'Archive test 66630fb1-c1c1-44de-bbf0-a36de88fd03d', '127.0.0.1', '2026-10-27 08:21:20', '2026-10-27 08:21:20'),
(115, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 08:28:08', '2026-10-27 08:28:08'),
(116, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-27 08:30:47', '2026-10-27 08:30:47'),
(117, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-27 08:31:31', '2026-10-27 08:31:31'),
(118, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-28 00:09:04', '2026-10-28 00:09:04'),
(119, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-28 00:10:58', '2026-10-28 00:10:58'),
(120, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-28 00:11:04', '2026-10-28 00:11:04'),
(121, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-28 00:11:08', '2026-10-28 00:11:08'),
(122, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-28 00:11:14', '2026-10-28 00:11:14'),
(123, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-28 00:12:21', '2026-10-28 00:12:21'),
(124, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-28 00:12:26', '2026-10-28 00:12:26'),
(125, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-28 00:14:39', '2026-10-28 00:14:39'),
(126, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-28 00:14:44', '2026-10-28 00:14:44'),
(127, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 01:57:05', '2026-10-29 01:57:05'),
(128, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 02:03:54', '2026-10-29 02:03:54'),
(129, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 02:15:04', '2026-10-29 02:15:04'),
(130, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 02:22:29', '2026-10-29 02:22:29'),
(131, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 05:33:30', '2026-10-29 05:33:30'),
(132, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 05:54:23', '2026-10-29 05:54:23'),
(133, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 05:54:25', '2026-10-29 05:54:25'),
(134, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 05:59:44', '2026-10-29 05:59:44'),
(135, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 05:59:51', '2026-10-29 05:59:51'),
(136, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 05:59:56', '2026-10-29 05:59:56'),
(137, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 06:02:26', '2026-10-29 06:02:26'),
(138, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 06:02:29', '2026-10-29 06:02:29'),
(139, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 06:02:30', '2026-10-29 06:02:30'),
(140, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 06:02:32', '2026-10-29 06:02:32'),
(141, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 06:03:30', '2026-10-29 06:03:30'),
(142, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 06:03:43', '2026-10-29 06:03:43'),
(143, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 06:07:42', '2026-10-29 06:07:42'),
(144, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 06:11:19', '2026-10-29 06:11:19'),
(145, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 06:11:53', '2026-10-29 06:11:53'),
(146, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 07:21:15', '2026-10-29 07:21:15'),
(147, 1, 'Updated homepage content', 'Website Content', 'Published homepage content changes.', '::1', '2026-10-29 07:23:43', '2026-10-29 07:23:43'),
(148, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 07:24:42', '2026-10-29 07:24:42'),
(149, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 07:26:05', '2026-10-29 07:26:05'),
(150, 1, 'Updated homepage content', 'Website Content', 'Published homepage content changes.', '::1', '2026-10-29 07:26:22', '2026-10-29 07:26:22'),
(151, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 07:28:39', '2026-10-29 07:28:39'),
(152, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 07:32:41', '2026-10-29 07:32:41'),
(153, 1, 'Signed in', 'Authentication', 'admin@eventfair.local signed in.', '::1', '2026-10-29 07:35:27', '2026-10-29 07:35:27'),
(154, 1, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 07:39:53', '2026-10-29 07:39:53'),
(155, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-29 07:39:58', '2026-10-29 07:39:58'),
(156, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 07:40:01', '2026-10-29 07:40:01'),
(157, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-29 07:40:06', '2026-10-29 07:40:06'),
(158, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 07:40:09', '2026-10-29 07:40:09'),
(159, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-29 07:42:01', '2026-10-29 07:42:01'),
(160, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-29 07:42:22', '2026-10-29 07:42:22'),
(161, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 07:45:52', '2026-10-29 07:45:52'),
(162, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-29 07:45:57', '2026-10-29 07:45:57'),
(163, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-29 07:47:12', '2026-10-29 07:47:12'),
(164, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 07:47:18', '2026-10-29 07:47:18'),
(165, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-29 07:47:26', '2026-10-29 07:47:26'),
(166, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 07:47:36', '2026-10-29 07:47:36'),
(167, 2, 'Signed in', 'Authentication', 'organizer@eventfair.local signed in.', '::1', '2026-10-29 07:50:08', '2026-10-29 07:50:08'),
(168, 2, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 08:03:35', '2026-10-29 08:03:35'),
(169, 3, 'Signed in', 'Authentication', 'judge@eventfair.local signed in.', '::1', '2026-10-29 08:04:24', '2026-10-29 08:04:24'),
(170, 3, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 08:14:08', '2026-10-29 08:14:08'),
(171, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-29 13:01:07', '2026-10-29 13:01:07'),
(172, 4, 'Signed out', 'Authentication', 'User signed out.', '::1', '2026-10-29 13:15:43', '2026-10-29 13:15:43'),
(173, 4, 'Signed in', 'Authentication', 'tabulator@eventfair.local signed in.', '::1', '2026-10-29 13:15:47', '2026-10-29 13:15:47');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `displayOrder` int NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `eventId`, `name`, `description`, `displayOrder`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Production Number', '', 1, '2026-10-26 13:43:42', '2026-10-26 13:43:42');

-- --------------------------------------------------------

--
-- Table structure for table `contestants`
--

CREATE TABLE `contestants` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `categoryId` int DEFAULT NULL,
  `contestantNumber` varchar(255) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `middleName` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `biography` text,
  `status` enum('registered','withdrawn','disqualified') NOT NULL DEFAULT 'registered',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `imageUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `contestants`
--

INSERT INTO `contestants` (`id`, `eventId`, `categoryId`, `contestantNumber`, `firstName`, `lastName`, `middleName`, `gender`, `age`, `organization`, `biography`, `status`, `createdAt`, `updatedAt`, `imageUrl`) VALUES
(1, 1, 1, '1', 'Rhyme', 'Espino', 'Lorenz', 'Female', 22, '', '', 'registered', '2026-10-26 13:47:29', '2026-10-26 13:47:29', NULL),
(2, 1, 1, '2', 'Lisa', 'Manobon', NULL, 'Female', 23, '', '', 'registered', '2026-10-27 02:51:15', '2026-10-27 02:51:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `criteria`
--

CREATE TABLE `criteria` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `categoryId` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `weightPercentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `minScore` decimal(8,2) NOT NULL DEFAULT '0.00',
  `maxScore` decimal(8,2) NOT NULL DEFAULT '100.00',
  `displayOrder` int NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `criteria`
--

INSERT INTO `criteria` (`id`, `eventId`, `categoryId`, `name`, `description`, `weightPercentage`, `minScore`, `maxScore`, `displayOrder`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 'Awra', '', 30.00, 30.00, 40.00, 1, '2026-10-26 13:46:09', '2026-10-26 13:46:09'),
(2, 1, 1, 'Posture', '', 30.00, 30.00, 40.00, 1, '2026-10-27 04:26:59', '2026-10-27 04:26:59'),
(3, 1, 1, 'Costume', '', 40.00, 40.00, 50.00, 1, '2026-10-27 04:27:29', '2026-10-27 04:27:29');

-- --------------------------------------------------------

--
-- Table structure for table `discrepancies`
--

CREATE TABLE `discrepancies` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `contestantId` int DEFAULT NULL,
  `reportedBy` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('open','under_review','resolved') NOT NULL DEFAULT 'open',
  `resolutionNotes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `venue` varchar(255) DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `status` enum('draft','scheduled','ongoing','judging','tabulated','published','archived') NOT NULL DEFAULT 'draft',
  `createdBy` int NOT NULL,
  `evaluationInstructions` text,
  `scoringNotes` text,
  `scoringFormula` enum('average_weighted','sum_weighted') NOT NULL DEFAULT 'average_weighted',
  `allowScoreRevision` tinyint(1) NOT NULL DEFAULT '1',
  `resultsPublishedAt` datetime DEFAULT NULL,
  `resultsApprovedBy` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `name`, `description`, `venue`, `startDate`, `endDate`, `status`, `createdBy`, `evaluationInstructions`, `scoringNotes`, `scoringFormula`, `allowScoreRevision`, `resultsPublishedAt`, `resultsApprovedBy`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Miss Teen Bansud', '', 'Gymnasium', '2026-10-26', '2026-10-29', 'tabulated', 2, '', '', 'sum_weighted', 1, NULL, NULL, '2026-10-26 13:42:03', '2026-10-27 04:28:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `event_assignments`
--

CREATE TABLE `event_assignments` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `userId` int NOT NULL,
  `assignmentRole` enum('judge','tabulator') NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `event_assignments`
--

INSERT INTO `event_assignments` (`id`, `eventId`, `userId`, `assignmentRole`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, 1, 3, 'judge', '', '2026-10-26 13:46:26', '2026-10-26 13:46:26'),
(2, 1, 4, 'tabulator', '', '2026-10-26 13:46:31', '2026-10-26 13:46:31');

-- --------------------------------------------------------

--
-- Table structure for table `homepage_videos`
--

CREATE TABLE `homepage_videos` (
  `id` int NOT NULL,
  `title` varchar(120) NOT NULL,
  `description` text,
  `videoUrl` varchar(2048) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scores`
--

CREATE TABLE `scores` (
  `id` int NOT NULL,
  `scoreSheetId` int NOT NULL,
  `criterionId` int NOT NULL,
  `scoreValue` decimal(8,2) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `scores`
--

INSERT INTO `scores` (`id`, `scoreSheetId`, `criterionId`, `scoreValue`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 35.00, '2026-10-26 13:50:32', '2026-10-26 13:50:32'),
(2, 2, 1, 37.00, '2026-10-27 02:52:31', '2026-10-27 02:52:31'),
(3, 1, 2, 38.00, '2026-10-27 04:28:25', '2026-10-27 04:28:25'),
(4, 1, 3, 41.00, '2026-10-27 04:28:25', '2026-10-27 04:28:25'),
(5, 2, 2, 32.00, '2026-10-27 04:28:44', '2026-10-27 04:28:44'),
(6, 2, 3, 48.00, '2026-10-27 04:28:44', '2026-10-27 04:28:44');

-- --------------------------------------------------------

--
-- Table structure for table `score_sheets`
--

CREATE TABLE `score_sheets` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `contestantId` int NOT NULL,
  `judgeId` int NOT NULL,
  `status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
  `submittedAt` datetime DEFAULT NULL,
  `remarks` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `score_sheets`
--

INSERT INTO `score_sheets` (`id`, `eventId`, `contestantId`, `judgeId`, `status`, `submittedAt`, `remarks`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 3, 'submitted', '2026-10-27 04:28:25', 'maganda', '2026-10-26 13:50:32', '2026-10-27 04:28:25'),
(2, 1, 2, 3, 'submitted', '2026-10-27 04:28:44', '', '2026-10-27 02:52:31', '2026-10-27 04:28:44');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int NOT NULL,
  `settingKey` varchar(255) NOT NULL,
  `settingValue` text,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `settingKey`, `settingValue`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'system_name', 'EventFair', 'Public system name displayed across the platform.', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL),
(2, 'allow_public_registration', 'true', 'Allow new event organizers to register from the login page.', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL),
(3, 'results_require_approval', 'true', 'Require event organizer approval before publishing rankings.', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL),
(4, 'maintenance_mode', 'false', 'Temporarily restrict access for system maintenance.', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL),
(6, 'homepage_content', '{\"brand\":{\"name\":\"EventFair\",\"subtitle\":\"EVENT & JUDGING MANAGEMENT\",\"logo\":\"/uploads/homepage/ec0b1148-3bad-4a5b-8315-6bfef06e381e.jpg\",\"signInLabel\":\"Sign in\",\"signInHref\":\"/login\",\"actionLabel\":\"Get started\",\"actionHref\":\"/register\"},\"hero\":{\"eyebrow\":\"Event & Judging Management\",\"titleLead\":\"Great events deserve\",\"titleAccent\":\"fair results.\",\"description\":\"Bring event setup, confidential judging, score verification, and final results together in one clear, accountable platform.\",\"primaryLabel\":\"Create an account\",\"primaryHref\":\"/register\",\"secondaryLabel\":\"See how it works\",\"secondaryHref\":\"#process\",\"highlightOne\":\"Role-based access\",\"highlightTwo\":\"Confidential score entry\",\"highlightThree\":\"Auditable results\",\"image\":\"/uploads/homepage/6db50afb-ae03-4249-b2fe-6071572e6417.jpg\"},\"sections\":{\"roles\":{\"visible\":true,\"order\":1,\"eyebrow\":\"Designed for the whole team\",\"title\":\"Every role has a clear place.\",\"description\":\"Keep responsibilities organized from event preparation through final approval.\",\"administratorTitle\":\"Administrator\",\"administratorDescription\":\"Manage accounts, access roles, system settings, and activity records.\",\"organizerTitle\":\"Event organizer\",\"organizerDescription\":\"Coordinate events, contestants, judging criteria, and assignments.\",\"judgeTitle\":\"Judge\",\"judgeDescription\":\"Review assigned events and submit scores privately against clear criteria.\",\"tabulatorTitle\":\"Tabulator\",\"tabulatorDescription\":\"Verify submissions, compute rankings, resolve discrepancies, and report.\"},\"process\":{\"visible\":true,\"order\":2,\"eyebrow\":\"A dependable process\",\"title\":\"From event setup to final results.\",\"description\":\"A clear workflow keeps every stage organized and accountable.\",\"prepareLabel\":\"01 / PREPARE\",\"prepareTitle\":\"Set up the event\",\"prepareDescription\":\"Organizers define categories, contestants, criteria, and judge assignments.\",\"evaluateLabel\":\"02 / EVALUATE\",\"evaluateTitle\":\"Collect judge scores\",\"evaluateDescription\":\"Judges submit their evaluations through their own dedicated workspace.\",\"verifyLabel\":\"03 / VERIFY\",\"verifyTitle\":\"Check and tabulate\",\"verifyDescription\":\"Tabulators review submissions, resolve discrepancies, and compute results.\",\"publishLabel\":\"04 / PUBLISH\",\"publishTitle\":\"Approve final results\",\"publishDescription\":\"Release approved rankings and reports with a clear record of the process.\"},\"callToAction\":{\"visible\":true,\"order\":3,\"eyebrow\":\"Ready to get started?\",\"title\":\"Run your next event with confidence.\",\"description\":\"One organized platform for your event team and judging workflow.\",\"buttonLabel\":\"Register as organizer\",\"buttonHref\":\"/register\"}}}', 'Editable public homepage content managed from the admin dashboard.', '2026-10-29 07:23:43', '2026-10-29 07:26:22', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tabulation_reports`
--

CREATE TABLE `tabulation_reports` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `generatedBy` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tabulation_reports`
--

INSERT INTO `tabulation_reports` (`id`, `eventId`, `generatedBy`, `title`, `summary`, `createdAt`, `updatedAt`) VALUES
(1, 1, 4, 'Final', 'Tabulation summary for Miss Teen Bansud.\nScoring formula: sum of weighted judge scores.\nComplete judge sheets: 0 of 2.\nRegistered contestants: 2; assigned judges: 1.\nOpen discrepancies at generation: 0.\nNo verified rankings were available when this report was generated.', '2026-10-27 02:56:31', '2026-10-27 02:56:31'),
(2, 1, 4, 'Final Results Report — Miss Teen Bansud', 'Tabulation summary for Miss Teen Bansud.\nEvent status at generation: tabulated.\nScoring formula: sum of weighted judge scores.\nComplete judge sheets: 2 of 2.\nSubmitted judge sheets: 2; draft judge sheets: 0.\nRegistered contestants: 2; assigned judges: 1.\nOpen discrepancies at generation: 0.\nChampion at snapshot by verified score: Lisa Manobon (#2, 90.15).\nOfficial placements and score standings:\nChampion | Lisa Manobon | Contestant #2 | 90.15 weighted total | raw total 117.00\n1st Runner-up | Rhyme Lorenz Espino | Contestant #1 | 87.55 weighted total | raw total 114.00', '2026-10-27 04:43:25', '2026-10-27 04:43:25'),
(3, 1, 4, 'Final Results Report — Miss Teen Bansud', 'Tabulation summary for Miss Teen Bansud.\nEvent status at generation: tabulated.\nScoring formula: sum of weighted judge scores.\nComplete judge sheets: 2 of 2.\nSubmitted judge sheets: 2; draft judge sheets: 0.\nRegistered contestants: 2; assigned judges: 1.\nOpen discrepancies at generation: 0.\nChampion at snapshot by verified score: Lisa Manobon (#2, 90.15).\nOfficial placements and score standings:\nChampion | Lisa Manobon | Contestant #2 | 90.15 weighted total | raw total 117.00\n1st Runner-up | Rhyme Lorenz Espino | Contestant #1 | 87.55 weighted total | raw total 114.00', '2026-10-27 04:43:34', '2026-10-27 04:43:34');

-- --------------------------------------------------------

--
-- Table structure for table `tabulation_results`
--

CREATE TABLE `tabulation_results` (
  `id` int NOT NULL,
  `eventId` int NOT NULL,
  `contestantId` int NOT NULL,
  `totalRawScore` decimal(10,2) NOT NULL DEFAULT '0.00',
  `totalWeightedScore` decimal(10,2) NOT NULL DEFAULT '0.00',
  `averageScore` decimal(10,2) NOT NULL DEFAULT '0.00',
  `rank` int DEFAULT NULL,
  `status` enum('draft','verified','published') NOT NULL DEFAULT 'draft',
  `tabulatedBy` int DEFAULT NULL,
  `tabulatedAt` datetime DEFAULT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tabulation_results`
--

INSERT INTO `tabulation_results` (`id`, `eventId`, `contestantId`, `totalRawScore`, `totalWeightedScore`, `averageScore`, `rank`, `status`, `tabulatedBy`, `tabulatedAt`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, 1, 2, 117.00, 90.15, 90.15, 1, 'verified', 4, '2026-10-27 04:28:59', NULL, '2026-10-27 04:28:59', '2026-10-27 04:28:59'),
(2, 1, 1, 114.00, 87.55, 87.55, 2, 'verified', 4, '2026-10-27 04:28:59', NULL, '2026-10-27 04:28:59', '2026-10-27 04:28:59');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','event_organizer','judge','tabulator') NOT NULL DEFAULT 'event_organizer',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `phone` varchar(255) DEFAULT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`, `phone`, `organization`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'System Administrator', 'admin@eventfair.local', '$2b$10$xruF72C4txK6j4d25aZFhOhCcuM2KIvm0.yPqeSQ0hzuB7m/e.Jwm', 'admin', 'active', NULL, 'EventFair', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL),
(2, 'Event Organizer', 'organizer@eventfair.local', '$2b$10$8bKp5b1jl4l6Pu7k60BY9uOWwn0FpDZqCyw70fNxozEor2O36t.me', 'event_organizer', 'active', NULL, 'EventFair', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL),
(3, 'Competition Judge', 'judge@eventfair.local', '$2b$10$X00iZYOMvWLMAKt4exh.eeiaLxlU4Bo3akYlta2grJzj1KB2ZekWi', 'judge', 'active', NULL, 'EventFair', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL),
(4, 'Official Tabulator', 'tabulator@eventfair.local', '$2b$10$VcOmsoKHhkePIOV/U8zsFem7wyGg4jC3xm0o3P5OmHjjCqxIzHO3.', 'tabulator', 'active', NULL, 'EventFair', '2026-10-20 09:22:02', '2026-10-20 09:22:02', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`);

--
-- Indexes for table `contestants`
--
ALTER TABLE `contestants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `criteria`
--
ALTER TABLE `criteria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `discrepancies`
--
ALTER TABLE `discrepancies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`),
  ADD KEY `contestantId` (`contestantId`),
  ADD KEY `reportedBy` (`reportedBy`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `createdBy` (`createdBy`),
  ADD KEY `resultsApprovedBy` (`resultsApprovedBy`);

--
-- Indexes for table `event_assignments`
--
ALTER TABLE `event_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `homepage_videos`
--
ALTER TABLE `homepage_videos`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `scores`
--
ALTER TABLE `scores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `scoreSheetId` (`scoreSheetId`),
  ADD KEY `criterionId` (`criterionId`);

--
-- Indexes for table `score_sheets`
--
ALTER TABLE `score_sheets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`),
  ADD KEY `contestantId` (`contestantId`),
  ADD KEY `judgeId` (`judgeId`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settingKey` (`settingKey`);

--
-- Indexes for table `tabulation_reports`
--
ALTER TABLE `tabulation_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`),
  ADD KEY `generatedBy` (`generatedBy`);

--
-- Indexes for table `tabulation_results`
--
ALTER TABLE `tabulation_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventId` (`eventId`),
  ADD KEY `contestantId` (`contestantId`),
  ADD KEY `tabulatedBy` (`tabulatedBy`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=174;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contestants`
--
ALTER TABLE `contestants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `criteria`
--
ALTER TABLE `criteria`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `discrepancies`
--
ALTER TABLE `discrepancies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `event_assignments`
--
ALTER TABLE `event_assignments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `homepage_videos`
--
ALTER TABLE `homepage_videos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `scores`
--
ALTER TABLE `scores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `score_sheets`
--
ALTER TABLE `score_sheets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tabulation_reports`
--
ALTER TABLE `tabulation_reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tabulation_results`
--
ALTER TABLE `tabulation_results`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contestants`
--
ALTER TABLE `contestants`
  ADD CONSTRAINT `contestants_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `contestants_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `criteria`
--
ALTER TABLE `criteria`
  ADD CONSTRAINT `criteria_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `criteria_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `discrepancies`
--
ALTER TABLE `discrepancies`
  ADD CONSTRAINT `discrepancies_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `discrepancies_ibfk_2` FOREIGN KEY (`contestantId`) REFERENCES `contestants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `discrepancies_ibfk_3` FOREIGN KEY (`reportedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `events_ibfk_2` FOREIGN KEY (`resultsApprovedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `event_assignments`
--
ALTER TABLE `event_assignments`
  ADD CONSTRAINT `event_assignments_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `event_assignments_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `scores`
--
ALTER TABLE `scores`
  ADD CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`scoreSheetId`) REFERENCES `score_sheets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`criterionId`) REFERENCES `criteria` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `score_sheets`
--
ALTER TABLE `score_sheets`
  ADD CONSTRAINT `score_sheets_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `score_sheets_ibfk_2` FOREIGN KEY (`contestantId`) REFERENCES `contestants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `score_sheets_ibfk_3` FOREIGN KEY (`judgeId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tabulation_reports`
--
ALTER TABLE `tabulation_reports`
  ADD CONSTRAINT `tabulation_reports_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tabulation_reports_ibfk_2` FOREIGN KEY (`generatedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tabulation_results`
--
ALTER TABLE `tabulation_results`
  ADD CONSTRAINT `tabulation_results_ibfk_1` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tabulation_results_ibfk_2` FOREIGN KEY (`contestantId`) REFERENCES `contestants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tabulation_results_ibfk_3` FOREIGN KEY (`tabulatedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
