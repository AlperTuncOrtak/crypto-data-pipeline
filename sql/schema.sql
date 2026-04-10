-- MySQL dump 10.13  Distrib 9.6.0, for macos15 (arm64)
--
-- Host: localhost    Database: crypto_analysis
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '5bf4dd66-2cd3-11f1-a893-32acc7e010aa:1-321';

--
-- Table structure for table `coins`
--

DROP TABLE IF EXISTS `coins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `symbol` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `symbol` (`symbol`)
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crypto_prices`
--

DROP TABLE IF EXISTS `crypto_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crypto_prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `symbol` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `current_price` decimal(18,8) DEFAULT NULL,
  `market_cap` bigint DEFAULT NULL,
  `total_volume` bigint DEFAULT NULL,
  `price_change_24h` decimal(18,8) DEFAULT NULL,
  `price_change_percentage_24h` decimal(10,4) DEFAULT NULL,
  `collected_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `latest_prices`
--

DROP TABLE IF EXISTS `latest_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `latest_prices` (
  `coin_id` int NOT NULL,
  `current_price` decimal(18,8) DEFAULT NULL,
  `market_cap` bigint DEFAULT NULL,
  `total_volume` bigint DEFAULT NULL,
  `price_change_24h` decimal(18,8) DEFAULT NULL,
  `price_change_percentage_24h` decimal(10,4) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`coin_id`),
  CONSTRAINT `latest_prices_ibfk_1` FOREIGN KEY (`coin_id`) REFERENCES `coins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `price_history`
--

DROP TABLE IF EXISTS `price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coin_id` int NOT NULL,
  `current_price` decimal(18,8) DEFAULT NULL,
  `market_cap` bigint DEFAULT NULL,
  `total_volume` bigint DEFAULT NULL,
  `price_change_24h` decimal(18,8) DEFAULT NULL,
  `price_change_percentage_24h` decimal(10,4) DEFAULT NULL,
  `collected_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_price_history_coin_time` (`coin_id`,`collected_at`),
  CONSTRAINT `price_history_ibfk_1` FOREIGN KEY (`coin_id`) REFERENCES `coins` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12743 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `price_history_archive`
--

DROP TABLE IF EXISTS `price_history_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_history_archive` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coin_id` int NOT NULL,
  `current_price` decimal(18,8) DEFAULT NULL,
  `market_cap` bigint DEFAULT NULL,
  `total_volume` bigint DEFAULT NULL,
  `price_change_24h` decimal(18,8) DEFAULT NULL,
  `price_change_percentage_24h` decimal(10,4) DEFAULT NULL,
  `collected_at` timestamp NULL DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `coin_id` (`coin_id`),
  CONSTRAINT `price_history_archive_ibfk_1` FOREIGN KEY (`coin_id`) REFERENCES `coins` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9396 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-10 10:43:21
