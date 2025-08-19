-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 19, 2025 at 08:00 AM
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

-- --------------------------------------------------------

--
-- Table structure for table `checkups`
--

CREATE TABLE `checkups` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `binocularPd` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkup_contact_lenses`
--

CREATE TABLE `checkup_contact_lenses` (
  `id` int(11) NOT NULL,
  `checkupId` int(11) NOT NULL,
  `sphereRight` varchar(20) DEFAULT NULL,
  `sphereLeft` varchar(20) DEFAULT NULL,
  `cylinderRight` varchar(20) DEFAULT NULL,
  `cylinderLeft` varchar(20) DEFAULT NULL,
  `axisRight` varchar(20) DEFAULT NULL,
  `axisLeft` varchar(20) DEFAULT NULL,
  `additionRight` varchar(20) DEFAULT NULL,
  `additionLeft` varchar(20) DEFAULT NULL,
  `baseCurveRight` varchar(20) DEFAULT NULL,
  `baseCurveLeft` varchar(20) DEFAULT NULL,
  `diameterPdRight` varchar(20) DEFAULT NULL,
  `diameterPdLeft` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `checkup_spectacles`
--

CREATE TABLE `checkup_spectacles` (
  `id` int(11) NOT NULL,
  `checkupId` int(11) NOT NULL,
  `sphereRight` varchar(20) DEFAULT NULL,
  `sphereLeft` varchar(20) DEFAULT NULL,
  `cylinderRight` varchar(20) DEFAULT NULL,
  `cylinderLeft` varchar(20) DEFAULT NULL,
  `axisRight` varchar(20) DEFAULT NULL,
  `axisLeft` varchar(20) DEFAULT NULL,
  `additionRight` varchar(20) DEFAULT NULL,
  `additionLeft` varchar(20) DEFAULT NULL,
  `visualAquityRight` varchar(20) DEFAULT NULL,
  `visualAquityLeft` varchar(20) DEFAULT NULL,
  `monocularPdRight` varchar(20) DEFAULT NULL,
  `monocularPdLeft` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `type` varchar(100) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `orderNumber` varchar(100) NOT NULL,
  `supplierId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `orderDate` date NOT NULL,
  `expectedDeliveryDate` date DEFAULT NULL,
  `status` enum('pending','ordered','received','cancelled') DEFAULT 'pending',
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `priceItemId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  `totalPrice` decimal(10,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `middleName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) NOT NULL,
  `sex` enum('male','female') NOT NULL,
  `birthdate` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `contactNumber` varchar(20) DEFAULT NULL,
  `telephoneNumber` varchar(20) DEFAULT NULL,
  `seniorNumber` varchar(20) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `client_cd` varchar(50) DEFAULT NULL,
  `searchStr` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `price_categories`
--

CREATE TABLE `price_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `price_categories`
--

INSERT INTO `price_categories` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 'Frames', 'Eyeglass frames', '2025-08-19 05:52:06', '2025-08-19 05:52:06'),
(2, 'Lenses', 'Prescription lenses', '2025-08-19 05:52:06', '2025-08-19 05:52:06'),
(3, 'Contact Lenses', 'Contact lens products', '2025-08-19 05:52:06', '2025-08-19 05:52:06'),
(4, 'Services', 'Eye examination services', '2025-08-19 05:52:06', '2025-08-19 05:52:06');

-- --------------------------------------------------------

--
-- Table structure for table `price_items`
--

CREATE TABLE `price_items` (
  `id` int(11) NOT NULL,
  `index_num` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `service` tinyint(1) DEFAULT 0,
  `pcPrice` decimal(10,2) NOT NULL,
  `pcCost` decimal(10,2) DEFAULT NULL,
  `bcmm` varchar(50) DEFAULT NULL,
  `diameter` varchar(50) DEFAULT NULL,
  `priceCategoryId` int(11) DEFAULT NULL,
  `supplierId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `priceItemId` int(11) NOT NULL,
  `priceItemIndex` int(11) DEFAULT NULL,
  `priceItemDescription` text DEFAULT NULL,
  `priceItemCode` varchar(50) DEFAULT NULL,
  `priceItemService` tinyint(1) DEFAULT 0,
  `priceItemPcPrice` decimal(10,2) DEFAULT NULL,
  `priceItemPcCost` decimal(10,2) DEFAULT NULL,
  `priceItemBcmm` varchar(50) DEFAULT NULL,
  `priceItemDiameter` varchar(50) DEFAULT NULL,
  `supplierId` int(11) DEFAULT NULL,
  `supplierName` varchar(255) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT 0,
  `sph` decimal(5,2) DEFAULT NULL,
  `cyl` decimal(5,2) DEFAULT NULL,
  `add_power` decimal(5,2) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `lowStockThreshold` int(11) DEFAULT 5,
  `stockStatus` tinyint(4) DEFAULT 0 COMMENT '0=normal, 1=low, 2=service',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contactPerson` varchar(100) DEFAULT NULL,
  `contactNumber` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `receiptNumber` varchar(100) NOT NULL,
  `adjustmentRequestedPrice` decimal(10,2) DEFAULT 0.00,
  `adjustmentRequestedReason` text DEFAULT NULL,
  `adjustmentPrice` decimal(10,2) DEFAULT 0.00,
  `adjustmentReason` text DEFAULT NULL,
  `adjustmentApproved` tinyint(1) DEFAULT 0,
  `refunded` tinyint(1) DEFAULT 0,
  `total` decimal(10,2) DEFAULT NULL,
  `totalDiscounted` decimal(10,2) DEFAULT NULL,
  `totalDiscount` decimal(10,2) DEFAULT NULL,
  `totalPayment` decimal(10,2) DEFAULT NULL,
  `paid` tinyint(1) DEFAULT NULL,
  `unpaid` decimal(10,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_items`
--

CREATE TABLE `transaction_items` (
  `id` int(11) NOT NULL,
  `transactionId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `discountApproved` tinyint(1) DEFAULT 0,
  `completed` tinyint(1) DEFAULT 0,
  `total` decimal(10,2) DEFAULT NULL,
  `totalDiscounted` decimal(10,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_payments`
--

CREATE TABLE `transaction_payments` (
  `id` int(11) NOT NULL,
  `transactionId` int(11) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `userName` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `type` enum('admin','employee') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `userName`, `password`, `type`, `status`, `createdAt`, `updatedAt`) VALUES
(2, 'Jamin Paul', 'Sapalo', 'Admin', '$2b$10$Jqfg/ECa6MnDPvLWx0QUFOk5sE0Uos02qjk1g4.kICWRSftNC8ple', 'admin', 'active', '2025-08-19 05:59:10', '2025-08-19 05:59:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `checkups`
--
ALTER TABLE `checkups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`userId`),
  ADD KEY `idx_patient` (`patientId`),
  ADD KEY `idx_date` (`date`);

--
-- Indexes for table `checkup_contact_lenses`
--
ALTER TABLE `checkup_contact_lenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_checkup` (`checkupId`);

--
-- Indexes for table `checkup_spectacles`
--
ALTER TABLE `checkup_spectacles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_checkup` (`checkupId`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`userId`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created` (`createdAt`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orderNumber` (`orderNumber`),
  ADD KEY `idx_supplier` (`supplierId`),
  ADD KEY `idx_user` (`userId`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_order_number` (`orderNumber`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order` (`orderId`),
  ADD KEY `idx_price_item` (`priceItemId`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `idx_name` (`firstName`,`middleName`,`lastName`),
  ADD KEY `idx_contact` (`contactNumber`,`telephoneNumber`),
  ADD KEY `idx_search` (`searchStr`(255));
ALTER TABLE `patients` ADD FULLTEXT KEY `idx_fulltext_search` (`firstName`,`middleName`,`lastName`,`contactNumber`,`seniorNumber`);

--
-- Indexes for table `price_categories`
--
ALTER TABLE `price_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_name` (`name`);

--
-- Indexes for table `price_items`
--
ALTER TABLE `price_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `priceCategoryId` (`priceCategoryId`),
  ADD KEY `supplierId` (`supplierId`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_description` (`description`(255)),
  ADD KEY `idx_price` (`pcPrice`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplierId` (`supplierId`),
  ADD KEY `idx_priceitem` (`priceItemId`),
  ADD KEY `idx_stock` (`stock`,`stockStatus`),
  ADD KEY `idx_sph_cyl_add` (`sph`,`cyl`,`add_power`),
  ADD KEY `idx_description` (`priceItemDescription`(255));

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
  ADD UNIQUE KEY `receiptNumber` (`receiptNumber`),
  ADD KEY `idx_user` (`userId`),
  ADD KEY `idx_patient` (`patientId`),
  ADD KEY `idx_receipt` (`receiptNumber`),
  ADD KEY `idx_date` (`createdAt`),
  ADD KEY `idx_paid` (`paid`);

--
-- Indexes for table `transaction_items`
--
ALTER TABLE `transaction_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transaction` (`transactionId`),
  ADD KEY `idx_product` (`productId`);

--
-- Indexes for table `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transaction` (`transactionId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userName` (`userName`),
  ADD KEY `idx_username` (`userName`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `checkups`
--
ALTER TABLE `checkups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checkup_contact_lenses`
--
ALTER TABLE `checkup_contact_lenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checkup_spectacles`
--
ALTER TABLE `checkup_spectacles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `price_categories`
--
ALTER TABLE `price_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `price_items`
--
ALTER TABLE `price_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaction_items`
--
ALTER TABLE `transaction_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaction_payments`
--
ALTER TABLE `transaction_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `checkups`
--
ALTER TABLE `checkups`
  ADD CONSTRAINT `checkups_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `checkups_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `checkup_contact_lenses`
--
ALTER TABLE `checkup_contact_lenses`
  ADD CONSTRAINT `checkup_contact_lenses_ibfk_1` FOREIGN KEY (`checkupId`) REFERENCES `checkups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `checkup_spectacles`
--
ALTER TABLE `checkup_spectacles`
  ADD CONSTRAINT `checkup_spectacles_ibfk_1` FOREIGN KEY (`checkupId`) REFERENCES `checkups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`priceItemId`) REFERENCES `price_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `price_items`
--
ALTER TABLE `price_items`
  ADD CONSTRAINT `price_items_ibfk_1` FOREIGN KEY (`priceCategoryId`) REFERENCES `price_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `price_items_ibfk_2` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`priceItemId`) REFERENCES `price_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transaction_items`
--
ALTER TABLE `transaction_items`
  ADD CONSTRAINT `transaction_items_ibfk_1` FOREIGN KEY (`transactionId`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_items_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD CONSTRAINT `transaction_payments_ibfk_1` FOREIGN KEY (`transactionId`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
