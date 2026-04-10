mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 9.5.0, for macos15 (arm64)
--
-- Host: mainline.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

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

--
-- Table structure for table `facebook_ads`
--

DROP TABLE IF EXISTS `facebook_ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facebook_ads` (
  `date` date NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `campaign_name` varchar(255) NOT NULL,
  `ad_set_id` varchar(50) NOT NULL,
  `ad_set_name` varchar(255) NOT NULL,
  `impressions` int NOT NULL,
  `clicks` int NOT NULL,
  `spend` decimal(10,2) NOT NULL,
  `conversions` int NOT NULL,
  `video_views` int NOT NULL,
  `engagement_rate` decimal(8,4) NOT NULL,
  `reach` int NOT NULL,
  `frequency` decimal(6,2) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `google_ads`
--

DROP TABLE IF EXISTS `google_ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `google_ads` (
  `date` date NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `campaign_name` varchar(255) NOT NULL,
  `ad_group_id` varchar(50) NOT NULL,
  `ad_group_name` varchar(255) NOT NULL,
  `impressions` int NOT NULL,
  `clicks` int NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `conversions` int NOT NULL,
  `conversion_value` decimal(10,2) NOT NULL,
  `ctr` decimal(8,4) NOT NULL,
  `avg_cpc` decimal(8,2) NOT NULL,
  `quality_score` tinyint NOT NULL,
  `search_impression_share` decimal(5,2) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tiktok_ads`
--

DROP TABLE IF EXISTS `tiktok_ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiktok_ads` (
  `date` date NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `campaign_name` varchar(255) NOT NULL,
  `adgroup_id` varchar(50) NOT NULL,
  `adgroup_name` varchar(255) NOT NULL,
  `impressions` int NOT NULL,
  `clicks` int NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `conversions` int NOT NULL,
  `video_views` int NOT NULL,
  `video_watch_25` int NOT NULL,
  `video_watch_50` int NOT NULL,
  `video_watch_75` int NOT NULL,
  `video_watch_100` int NOT NULL,
  `likes` int NOT NULL,
  `shares` int NOT NULL,
  `comments` int NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unified_ads`
--

DROP TABLE IF EXISTS `unified_ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unified_ads` (
  `ad_date` date NOT NULL,
  `platform` varchar(8) NOT NULL DEFAULT '',
  `campaign_name` varchar(255) NOT NULL DEFAULT '',
  `impressions` int NOT NULL DEFAULT '0',
  `clicks` int NOT NULL DEFAULT '0',
  `spend` decimal(10,2) NOT NULL DEFAULT '0.00',
  `conversions` int NOT NULL DEFAULT '0',
  `video_views` bigint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-09 13:57:27
