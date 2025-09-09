-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 09, 2025 at 07:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tiberio`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_transaction_status` (IN `tx_id` INT)   BEGIN
    DECLARE total_items INT;
    DECLARE fulfilled_items INT;
    DECLARE refunded_items INT;
    DECLARE partial_items INT;
    DECLARE new_final DECIMAL(10,2);

    -- Count statuses
    SELECT COUNT(*), 
           SUM(status = 'fulfilled'),
           SUM(status = 'refunded'),
           SUM(status = 'partially_refunded')
    INTO total_items, fulfilled_items, refunded_items, partial_items
    FROM transaction_items
    WHERE transaction_id = tx_id;

    -- Recalculate final price (exclude refunded qty)
    SELECT COALESCE(SUM(((quantity - refunded_quantity) * unit_price) - discount),0)
    INTO new_final
    FROM transaction_items
    WHERE transaction_id = tx_id;

    UPDATE transactions
    SET final_price = new_final
    WHERE id = tx_id;

    -- Decide transaction status
    IF total_items = fulfilled_items THEN
        UPDATE transactions SET status = 'fulfilled' WHERE id = tx_id;

    ELSEIF total_items = refunded_items THEN
        UPDATE transactions SET status = 'refunded' WHERE id = tx_id;

    ELSEIF partial_items > 0 OR (refunded_items > 0 AND fulfilled_items > 0) THEN
        UPDATE transactions SET status = 'partially_refunded' WHERE id = tx_id;

    ELSE
        UPDATE transactions SET status = 'pending' WHERE id = tx_id;
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `checkups`
--

CREATE TABLE `checkups` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `checkup_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `binocular_pd` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `checkups`
--

INSERT INTO `checkups` (`id`, `user_id`, `patient_id`, `checkup_date`, `notes`, `diagnosis`, `binocular_pd`, `created_at`, `updated_at`, `is_deleted`) VALUES
(7, 1, 7, '2025-08-28', 'Notes', 'Diagnosis 2', NULL, '2025-08-27 16:51:35', '2025-09-01 06:01:28', 1),
(8, 1, 7, '2025-08-29', 'test', 'test', '1', '2025-08-29 05:41:21', '2025-09-01 05:36:04', 1),
(9, 1, 7, '2025-09-01', 'test', 'test', '1', '2025-09-01 04:43:03', '2025-09-01 05:02:56', 1),
(10, 1, 7, '2025-09-01', 'tes', 'test', NULL, '2025-09-01 04:45:28', '2025-09-01 04:48:33', 1),
(11, 1, 7, '2025-09-01', 'test', 'Update', '11', '2025-09-01 05:03:37', '2025-09-01 05:21:47', 1),
(12, 1, 7, '2025-09-01', 'test 2', 'test 2', '1', '2025-09-01 05:20:50', '2025-09-01 05:23:17', 1),
(13, 1, 7, '2025-09-01', '12', '12', '11', '2025-09-01 05:27:58', '2025-09-01 05:28:32', 1),
(14, 1, 7, '2025-09-01', '1', '1', NULL, '2025-09-01 05:29:47', '2025-09-01 05:33:25', 1),
(15, 1, 7, '2025-09-02', '1', 'Diagnosis Update', '1', '2025-09-02 06:52:27', '2025-09-02 06:53:23', 1),
(16, 1, 8, '2025-09-12', '123', '123', '1', '2025-09-05 08:13:19', '2025-09-05 08:13:19', 0);

-- --------------------------------------------------------

--
-- Table structure for table `contact_lens_prescriptions`
--

CREATE TABLE `contact_lens_prescriptions` (
  `contactId` int(11) NOT NULL,
  `checkupId` int(11) NOT NULL,
  `sphereRight` varchar(50) DEFAULT NULL,
  `sphereLeft` varchar(50) DEFAULT NULL,
  `cylinderRight` varchar(50) DEFAULT NULL,
  `cylinderLeft` varchar(50) DEFAULT NULL,
  `axisRight` varchar(50) DEFAULT NULL,
  `axisLeft` varchar(50) DEFAULT NULL,
  `additionRight` varchar(50) DEFAULT NULL,
  `additionLeft` varchar(50) DEFAULT NULL,
  `baseCurveRight` varchar(50) DEFAULT NULL,
  `baseCurveLeft` varchar(50) DEFAULT NULL,
  `diameterRight` varchar(50) DEFAULT NULL,
  `diameterLeft` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_lens_prescriptions`
--

INSERT INTO `contact_lens_prescriptions` (`contactId`, `checkupId`, `sphereRight`, `sphereLeft`, `cylinderRight`, `cylinderLeft`, `axisRight`, `axisLeft`, `additionRight`, `additionLeft`, `baseCurveRight`, `baseCurveLeft`, `diameterRight`, `diameterLeft`) VALUES
(6, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 8, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 9, '1', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 13, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 14, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 16, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `type` varchar(100) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `logs`
--

INSERT INTO `logs` (`id`, `user_id`, `type`, `data`, `created_at`) VALUES
(1, 1, '', NULL, '2025-08-19 06:24:33'),
(2, 1, '', NULL, '2025-08-20 02:17:02');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `total_price` decimal(12,2) DEFAULT NULL,
  `receipt_number` varchar(100) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `sex` enum('male','female') NOT NULL,
  `birthdate` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `telephone_number` varchar(20) DEFAULT NULL,
  `senior_number` varchar(20) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `client_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `first_name`, `middle_name`, `last_name`, `sex`, `birthdate`, `age`, `address`, `contact_number`, `telephone_number`, `senior_number`, `user_id`, `client_code`, `created_at`, `updated_at`) VALUES
(7, 'Jamin Paul', 'S', 'Sapalo', 'male', '2002-07-06', 23, 'Bacolod', '09954417332', '', '', 1, NULL, '2025-08-26 08:31:23', '2025-08-26 08:31:23'),
(8, 'Rachel', '', 'Rivera', 'female', '2003-12-05', 21, 'Talisay', '099123123', '', '', 1, NULL, '2025-08-26 08:53:48', '2025-08-26 08:53:48'),
(9, 'John ', 'D', 'Doe', 'male', '1999-03-03', 26, 'Somewhere', '099', '123', '', 1, NULL, '2025-08-26 09:18:39', '2025-08-26 09:18:39'),
(10, 'Jane ', 'D.', 'Dane', 'female', '1999-04-17', 26, 'Earth', '09', '123', '', 2, NULL, '2025-08-26 09:34:19', '2025-08-26 09:34:19'),
(11, 'Jane', 'D.', 'Doe', 'female', '2015-01-01', 10, 'Adress', '099123', '123', '', 1, NULL, '2025-08-27 06:39:16', '2025-08-27 06:39:16');

-- --------------------------------------------------------

--
-- Table structure for table `price_categories`
--

CREATE TABLE `price_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `price_categories`
--

INSERT INTO `price_categories` (`id`, `name`, `description`, `is_deleted`, `created_at`, `updated_at`) VALUES
(13, 'Single Vision', 'Single Vision Lenses', 0, '2025-08-29 04:10:12', '2025-08-29 04:10:12'),
(14, 'Double Vision', 'Double Vision Lenses', 0, '2025-08-29 04:10:12', '2025-08-29 04:10:12'),
(15, 'Progressive', 'Progressive Lenses', 0, '2025-08-29 04:10:12', '2025-08-29 04:10:12'),
(16, 'Contact Lens', 'Contact lens products', 0, '2025-08-29 04:10:12', '2025-08-29 04:10:12'),
(17, 'Solutions, Artificial Tears, Etc.', 'Solutions, artificial tears, and related products', 0, '2025-08-29 04:10:12', '2025-08-29 04:10:12'),
(18, 'Accessories', 'Eyewear accessories', 0, '2025-08-29 04:10:12', '2025-08-29 04:10:12'),
(19, 'Frames', 'Eyeglass frames', 0, '2025-08-29 04:10:12', '2025-08-29 04:10:12'),
(20, 'Services', 'Checkups ETC', 0, '2025-08-29 05:16:40', '2025-08-29 05:16:48');

-- --------------------------------------------------------

--
-- Table structure for table `price_subcategories`
--

CREATE TABLE `price_subcategories` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `price_subcategories`
--

INSERT INTO `price_subcategories` (`id`, `category_id`, `name`, `description`, `created_at`, `updated_at`, `is_deleted`) VALUES
(13, 13, 'SV Uncoated', '', '2025-09-03 01:53:55', '2025-09-03 01:53:55', 0),
(14, 14, 'DV Uncoated', '', '2025-09-03 06:20:44', '2025-09-03 06:20:44', 0),
(15, 15, 'Progressive', '', '2025-09-09 04:07:02', '2025-09-09 04:07:02', 0);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `pc_price` decimal(10,2) DEFAULT NULL,
  `pc_cost` decimal(10,2) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `low_stock_threshold` int(11) DEFAULT 5,
  `stock_status` varchar(20) NOT NULL DEFAULT 'normal' COMMENT 'normal, low, out-of-stock',
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attributes`)),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `subcategory_id`, `supplier_id`, `code`, `description`, `pc_price`, `pc_cost`, `stock`, `low_stock_threshold`, `stock_status`, `attributes`, `is_deleted`) VALUES
(15, 13, 4, '1', 'SV 1', 1.00, 1.00, 65, 1, 'normal', '{\"index\":\"1\",\"diameter\":\"1\",\"sphFR\":\"1\",\"sphTo\":\"1\",\"cylFr\":\"1\",\"cylTo\":\"1\",\"tp\":\"1\",\"steps\":\"\",\"addFr\":\"\",\"addTo\":\"\",\"modality\":\"\",\"set\":\"\",\"bc\":\"\",\"volume\":\"\",\"set_cost\":\"\",\"service\":0}', 0),
(16, 14, 5, '1', 'DV 1', 2.00, 2.00, 51, 1, 'normal', '{}', 0),
(17, 15, 4, '1', 'Progressive 1', 10.00, 10.00, 100, 10, 'normal', '{\"index\":\"1\",\"diameter\":\"1\",\"sphFR\":\"1\",\"sphTo\":\"1\",\"cylFr\":\"1\",\"cylTo\":\"1\",\"tp\":\"1\",\"steps\":\"\",\"addFr\":\"\",\"addTo\":\"\",\"modality\":\"\",\"set\":\"\",\"bc\":\"\",\"volume\":\"\",\"set_cost\":\"\",\"service\":0}', 0);

--
-- Triggers `products`
--
DELIMITER $$
CREATE TRIGGER `trg_products_stock_status_insert` BEFORE INSERT ON `products` FOR EACH ROW BEGIN
    IF NEW.stock <= 0 THEN
        SET NEW.stock_status = 'out-of-stock';
    ELSEIF NEW.stock <= NEW.low_stock_threshold THEN
        SET NEW.stock_status = 'low';
    ELSE
        SET NEW.stock_status = 'normal';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_products_stock_status_update` BEFORE UPDATE ON `products` FOR EACH ROW BEGIN
    IF NEW.stock <= 0 THEN
        SET NEW.stock_status = 'out-of-stock';
    ELSEIF NEW.stock <= NEW.low_stock_threshold THEN
        SET NEW.stock_status = 'low';
    ELSE
        SET NEW.stock_status = 'normal';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `spectacle_prescriptions`
--

CREATE TABLE `spectacle_prescriptions` (
  `spectacleId` int(11) NOT NULL,
  `checkupId` int(11) NOT NULL,
  `sphereRight` varchar(50) DEFAULT NULL,
  `cylinderRight` varchar(50) DEFAULT NULL,
  `axisRight` varchar(50) DEFAULT NULL,
  `additionRight` varchar(50) DEFAULT NULL,
  `visualAcuityRight` varchar(50) DEFAULT NULL,
  `monocularPdRight` varchar(50) DEFAULT NULL,
  `sphereLeft` varchar(50) DEFAULT NULL,
  `cylinderLeft` varchar(50) DEFAULT NULL,
  `axisLeft` varchar(50) DEFAULT NULL,
  `additionLeft` varchar(50) DEFAULT NULL,
  `visualAcuityLeft` varchar(50) DEFAULT NULL,
  `monocularPdLeft` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spectacle_prescriptions`
--

INSERT INTO `spectacle_prescriptions` (`spectacleId`, `checkupId`, `sphereRight`, `cylinderRight`, `axisRight`, `additionRight`, `visualAcuityRight`, `monocularPdRight`, `sphereLeft`, `cylinderLeft`, `axisLeft`, `additionLeft`, `visualAcuityLeft`, `monocularPdLeft`) VALUES
(6, 7, '+1', '1', '1', '1', '1', '1', '1', '1', '+2', '1', '1', '1'),
(7, 8, '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'),
(8, 9, '1', '1', NULL, NULL, NULL, NULL, '1', NULL, NULL, NULL, NULL, NULL),
(9, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 11, '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'),
(11, 12, '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'),
(12, 13, '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'),
(13, 14, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 15, '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'),
(15, 16, '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `contact_number`, `email`, `address`, `created_at`, `updated_at`, `is_deleted`) VALUES
(4, 'Source ', 'Barley France', '09', 'Secret@gmail.com', 'Secret ang address ni source', '2025-08-29 07:39:12', '2025-08-29 07:39:12', 0),
(5, 'Supplier 2', '', '', '', '', '2025-09-02 06:55:16', '2025-09-02 06:55:16', 0);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `receipt_number` varchar(100) NOT NULL,
  `subtotal_price` decimal(10,2) NOT NULL,
  `total_discount` decimal(10,2) DEFAULT 0.00,
  `final_price` decimal(10,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `status` enum('pending','fulfilled','cancelled','refunded','partially_refunded') DEFAULT 'pending',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `patient_id`, `receipt_number`, `subtotal_price`, `total_discount`, `final_price`, `discount_percent`, `status`, `deleted_at`, `created_at`, `updated_at`) VALUES
(15, 1, 7, '123', 8.00, 0.00, 8.00, 0.00, 'pending', '2025-09-05 08:42:25', '2025-09-05 08:30:41', '2025-09-05 08:42:25'),
(16, 1, 7, '345123', 4.00, 0.00, 4.00, 0.00, 'pending', '2025-09-05 08:51:52', '2025-09-05 08:51:15', '2025-09-05 08:51:52'),
(17, 2, 7, '5647324', 2.00, 0.00, 2.00, 0.00, 'pending', '2025-09-05 08:56:09', '2025-09-05 08:55:55', '2025-09-05 08:56:09'),
(18, 1, 7, '567453', 3.00, 0.00, 3.00, 0.00, 'fulfilled', '2025-09-05 09:57:55', '2025-09-05 09:55:18', '2025-09-05 09:57:55'),
(19, 1, 7, '25367', 3.00, 0.00, 3.00, 0.00, 'pending', '2025-09-05 09:57:58', '2025-09-05 09:57:33', '2025-09-05 09:57:58'),
(20, 2, 7, '5342675', 3.00, 0.00, 3.00, 0.00, 'fulfilled', NULL, '2025-09-05 10:00:40', '2025-09-08 02:15:06'),
(21, 1, 7, '45657', 20.00, 0.00, 20.00, 0.00, 'fulfilled', NULL, '2025-09-08 02:20:16', '2025-09-08 02:20:20');

-- --------------------------------------------------------

--
-- Table structure for table `transaction_items`
--

CREATE TABLE `transaction_items` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `status` enum('fulfilled','pending','refunded','partially_refunded') DEFAULT 'pending',
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `refunded_quantity` int(11) DEFAULT 0,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transaction_items`
--

INSERT INTO `transaction_items` (`id`, `transaction_id`, `product_id`, `status`, `quantity`, `unit_price`, `discount`, `refunded_quantity`, `refunded_at`, `created_at`, `updated_at`) VALUES
(20, 15, 16, 'pending', 3, 2.00, 0.00, 0, NULL, '2025-09-05 08:30:41', '2025-09-05 08:30:41'),
(21, 15, 15, 'pending', 2, 1.00, 0.00, 0, NULL, '2025-09-05 08:30:41', '2025-09-05 08:30:41'),
(22, 16, 16, 'pending', 2, 2.00, 0.00, 0, NULL, '2025-09-05 08:51:15', '2025-09-05 08:51:15'),
(23, 17, 15, 'pending', 2, 1.00, 0.00, 0, NULL, '2025-09-05 08:55:55', '2025-09-05 08:55:55'),
(24, 18, 15, 'fulfilled', 1, 1.00, 0.00, 0, NULL, '2025-09-05 09:55:18', '2025-09-05 09:55:55'),
(25, 18, 16, 'fulfilled', 1, 2.00, 0.00, 0, NULL, '2025-09-05 09:55:18', '2025-09-05 09:55:57'),
(26, 19, 15, 'pending', 3, 1.00, 0.00, 0, NULL, '2025-09-05 09:57:33', '2025-09-05 09:57:33'),
(27, 20, 16, 'fulfilled', 1, 2.00, 0.00, 0, NULL, '2025-09-05 10:00:40', '2025-09-08 02:15:05'),
(28, 20, 15, 'fulfilled', 1, 1.00, 0.00, 0, NULL, '2025-09-05 10:00:40', '2025-09-08 02:15:06'),
(29, 21, 15, 'fulfilled', 20, 1.00, 0.00, 0, NULL, '2025-09-08 02:20:16', '2025-09-08 02:20:20');

--
-- Triggers `transaction_items`
--
DELIMITER $$
CREATE TRIGGER `trg_transaction_items_after_insert` AFTER INSERT ON `transaction_items` FOR EACH ROW BEGIN
    CALL update_transaction_status(NEW.transaction_id);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_transaction_items_after_update` AFTER UPDATE ON `transaction_items` FOR EACH ROW BEGIN
    CALL update_transaction_status(NEW.transaction_id);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `type` enum('admin','employee') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `username`, `password`, `type`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Jamin', 'Sapalo', 'Admin', '$2b$10$rvVn4wdqGvkOgq5oWnftRulfSLuBWC32/AUHUKI0ds/A6hrTSZEhG', 'admin', 'active', '2025-08-19 06:21:55', '2025-08-26 09:31:38'),
(2, 'Ajay', 'Lim', 'Employee', '$2b$10$hPvfS0ojfxomkSd6VlQ3h.CyubZWIPqJ72VCkFBfCUbiAUm7e51v6', 'employee', 'active', '2025-08-20 02:17:44', '2025-08-27 17:22:14'),
(4, 'Test', '1', '1', '$2b$10$4quO30T5ibTGz1I2LaEGGuiNL3odLtUfg6bqCPPdDgq9gz4VZFIHa', 'employee', 'active', '2025-08-27 19:45:10', '2025-08-27 19:45:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `checkups`
--
ALTER TABLE `checkups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `contact_lens_prescriptions`
--
ALTER TABLE `contact_lens_prescriptions`
  ADD PRIMARY KEY (`contactId`),
  ADD KEY `checkupId` (`checkupId`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `fk_orders_supplier` (`supplier_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orderitems_order` (`order_id`),
  ADD KEY `fk_orderitems_product` (`item_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_name` (`first_name`,`middle_name`,`last_name`);

--
-- Indexes for table `price_categories`
--
ALTER TABLE `price_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `price_subcategories`
--
ALTER TABLE `price_subcategories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subcategory_id` (`category_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_subcategory_fk` (`subcategory_id`),
  ADD KEY `products_supplier_fk` (`supplier_id`);

--
-- Indexes for table `spectacle_prescriptions`
--
ALTER TABLE `spectacle_prescriptions`
  ADD PRIMARY KEY (`spectacleId`),
  ADD KEY `checkupId` (`checkupId`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_name` (`name`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `fk_transactions_user` (`user_id`),
  ADD KEY `fk_transactions_patient` (`patient_id`);

--
-- Indexes for table `transaction_items`
--
ALTER TABLE `transaction_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_transaction_items_tx` (`transaction_id`),
  ADD KEY `fk_transaction_items_product` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `checkups`
--
ALTER TABLE `checkups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `contact_lens_prescriptions`
--
ALTER TABLE `contact_lens_prescriptions`
  MODIFY `contactId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `price_categories`
--
ALTER TABLE `price_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `price_subcategories`
--
ALTER TABLE `price_subcategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `spectacle_prescriptions`
--
ALTER TABLE `spectacle_prescriptions`
  MODIFY `spectacleId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `transaction_items`
--
ALTER TABLE `transaction_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `checkups`
--
ALTER TABLE `checkups`
  ADD CONSTRAINT `checkups_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkups_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contact_lens_prescriptions`
--
ALTER TABLE `contact_lens_prescriptions`
  ADD CONSTRAINT `contact_lens_prescriptions_ibfk_1` FOREIGN KEY (`checkupId`) REFERENCES `checkups` (`id`);

--
-- Constraints for table `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `fk_orderitems_product` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `price_subcategories`
--
ALTER TABLE `price_subcategories`
  ADD CONSTRAINT `price_subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `price_categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_subcategory_fk` FOREIGN KEY (`subcategory_id`) REFERENCES `price_subcategories` (`id`),
  ADD CONSTRAINT `products_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `spectacle_prescriptions`
--
ALTER TABLE `spectacle_prescriptions`
  ADD CONSTRAINT `spectacle_prescriptions_ibfk_1` FOREIGN KEY (`checkupId`) REFERENCES `checkups` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transactions_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transaction_items`
--
ALTER TABLE `transaction_items`
  ADD CONSTRAINT `fk_transaction_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `fk_transaction_items_tx` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
