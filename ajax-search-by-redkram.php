<?php

/*
  Plugin Name: Ajax Search By Redkram - for Woocommerce
  Plugin URI: http://www.nuestratienda.net/
  Description: Buscador optimizado y testeado con más de 30K productos en la tienda de woocommerce.
  Author: Redkram
  Version: 0.0.1
  Author URI: http://www.nuestratienda.net/
  Text Domain: ajax-search-by-redkram
 */


	if ( !function_exists( 'add_action' ) ) {
		echo 'Hi there!  I\'m just a plugin, not much I can do when called directly.';
		exit;
	}

	define( 'REDKRAM_VERSION', '0.0.2' );
	define( 'REDKRAM__MINIMUM_WP_VERSION', '5.0' );
	define( 'REDKRAM__PLUGIN_NAME', 'ajax-search-by-redkram' );

	register_activation_hook( __FILE__, array( 'ajax_search_by_redkram', 'plugin_activation' ) );
	register_deactivation_hook( __FILE__, array( 'ajax_search_by_redkram', 'plugin_deactivation' ) );


if (!defined('ABSPATH')) exit; // Exit if accessed directly

add_action( 'get_footer', 'ajaxsearch_init', 1);
function ajaxsearch_init()
{
	wp_enqueue_script( REDKRAM__PLUGIN_NAME, plugins_url( REDKRAM__PLUGIN_NAME.'.js', __FILE__ ), [], REDKRAM_VERSION );
	wp_enqueue_style( REDKRAM__PLUGIN_NAME, plugins_url( REDKRAM__PLUGIN_NAME.'.css', __FILE__ ), [], REDKRAM_VERSION );
	wp_enqueue_style( 'load-fa', 'https://use.fontawesome.com/releases/v5.3.1/css/all.css' );
}
