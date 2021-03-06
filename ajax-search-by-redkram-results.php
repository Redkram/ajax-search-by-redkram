<?php
define( WP_USE_THEMES, false );
$path = preg_replace( '/wp-content( ?!.*wp-content ).*/', '', __DIR__ );
require $path . 'wp-load.php';
init();

function init ()
{
	global $pagenow;
	$entityBody = file_get_contents( 'php://input' );
	if ( empty( $entityBody ) ) return '{}';
	$paramZ = json_decode( $entityBody, true );
	if ( ( is_admin() && 'edit.php' !=  $pagenow ) ) {
		return '{}';
	} else {
		$results = ( !empty( $paramZ['params'] ) ) ? validateParams( $paramZ ) : SkuOemEan( $paramZ );
		if ( sizeof( $results ) > 0 ) {
			wpRequest( $results );
		}
		return '{}';
	}
}

function paramLike ( $term )
{
	global $wpdb;
	return '%' . $wpdb->esc_like( trim( $term ) ) . '%';
}

function SkuOemEan ( array $params )
{
	global $wpdb;
	if ( !empty( $params['sku'] ) ) {
		$term = paramLike( $params['sku'] );
		$where = " AND ( pm.meta_key = '_sku' AND pm.meta_value LIKE '{$term}' )";
	} else if ( !empty( $params['oem'] ) ) {
		$term = paramLike( $params['oem'] );
		$where = " AND ( pm.meta_key = 'Desc.Adicional' AND pm.meta_value LIKE '{$term}' )";
	} else if ( !empty( $params['ean'] ) ) {
		$term = paramLike( $params['ean'] );
		$where = " AND ( pm.meta_key = 'Codigo EAN' AND pm.meta_value LIKE '{$term}' )";
	} else {
		return false;
	}
	return $wpdb->get_col( "
		SELECT if ( p.post_parent = 0, p.id, p.post_parent ) ids
		FROM {$wpdb->posts} p 
		    JOIN {$wpdb->postmeta} pm 
		        ON p.ID = pm.post_id 
		WHERE 1 = 1 {$where} 
		GROUP BY ids 
		LIMIT 10"
	 );
}

/** Funcion de permutaciones sacada de https://stackoverrun.com/es/q/1588461
 * @param $in
 * @param int $minLength
 * @return array
 */
function permuted( $in, $minLength = 1 ) {
	$count      = count( $in );
	$members    = pow( 2, $count );
	$return     = [];
	for ( $i = 0; $i < $members; $i++ ) {
		$b      = sprintf( "%0".$count."b", $i );
		$out    = [];
		for ( $j = 0; $j < $count; $j++ ) {
			if ( $b{$j} ==  '1' ) $out[] = $in[$j];
		}
		$out_val = implode( " ", $out );
		if ( count( $out ) >=  $minLength ) {
			$return[] = $out_val;
		}
	}
	return $return;
}

function replaceTerms ( $term )
{
	$term = " ".$term. " ";
	$term = str_replace( " de ", '', $term );
	$term = str_replace( " del ", '', $term );
	$term = str_replace( " un ", '', $term );
	$term = str_replace( " unos ", '', $term );
	$term = str_replace( " una ", '', $term );
	$term = str_replace( " unas ", '', $term );
	$term = str_replace( " el ", '', $term );
	$term = str_replace( " lo ", '', $term );
	$term = str_replace( " los ", '', $term );
	$term = str_replace( " la ", '', $term );
	$term = str_replace( " las ", '', $term );
	$term = str_replace( " para ", '', $term );
	if( !preg_match( '/[^A-Za-z0-9_\-]/i', $term ) )
	{
		$term = '';
	}
	$term = trim( $term );
	if ( strlen( $term ) < 2 ) $term = '';
	return $term;
}

function validateParams ( array $params )
{
	global $wpdb;
	$params = $params['params'];
	$terms  = explode( " ", $params );
	
	foreach ( $terms as $key => $term ) {
		$term = replaceTerms( $term );
		if ( empty( $term ) )  unset( $terms[$key] );
	}
	
	$terms      = array_slice( $terms, 0, 5 );
	$terms      = array_values( $terms );
	$permuted   = permuted( $terms );
	$permuted   = array_reverse( $permuted );
	$querys     = [];
	
	foreach ( $permuted as $words ) {
		$newQuery   = '';
		$word       = explode( " ", $words );
		
		foreach ( $word as $like ) {
			if ( !empty( $newQuery ) ) $newQuery .=  ' AND ';
			$like = paramLike( $like );
			$newQuery .=  "
			(
				p.post_title LIKE '{$like}'
				OR p.post_content LIKE '{$like}'
				OR p.post_excerpt LIKE '{$like}'
				OR pm.meta_value LIKE '{$like}'
			)";
		}
		
		$querys[] = $newQuery;
	}
	$results = [];
	foreach ( $querys as $query ) {
		if ( !empty( $query ) ) $query = "AND ( " . $query . " )";
		$results = $wpdb->get_col( "
		SELECT if ( p.post_parent = 0, p.id, p.post_parent ) ids
		FROM {$wpdb->posts} AS p 
		    JOIN {$wpdb->postmeta} pm 
		        ON p.ID = pm.post_id 
               	AND ( 
					pm.meta_key = '_default_attributes'
					OR pm.meta_key = '_product_attributes'
               	    OR pm.meta_key = '_sku'
               	    OR pm.meta_key = 'Desc.Adicional'
                )
		WHERE 1 = 1 {$query} 
		GROUP BY ids 
		LIMIT 10"
		 );
		if ( sizeof( $results ) > 0 ) break;
	}
	return $results;
}

function wpRequest ( array $results ) {
	$products   = [];
	$results    = array_unique( $results );
	foreach ( $results as $productId ) {
		$product        = wc_get_product( $productId );
		$productData    = $product->get_data();
		$products[]     = [
			"product"       => ( array ) $productData, 
			"variations"    => ( $product->has_child() ) ? ( array ) variations( $product ) : null, 
			"link"          => get_permalink( $productData["id"] ), 
			"images"        => cwo_get_images_product( $product ), 
		];
	}
	response( $products );
}

function variations ( $product )
{
	$productId  = $product->get_id();
	$children   = $product->get_available_variations();
	$data       = [];
	foreach ( $children as $k => $item ) {
		$metas      = get_post_meta( $item['variation_id'] );
		$data[$k]   = [
			"product"   => array_merge( $item, ["parent_id" => $productId] ),
			"metas"     => $metas,
			"images"    => $item["image"]["url"],
			"color"     => $metas['attribute_pa_color'][0],
		];
	}
	return $data;
}

function response ( $products )
{
	header( 'Content-Type: application/json' );
	echo json_encode( $products );
}

function cwo_get_images_product( WC_Product $product )
{
	$image = [];

	if( $external_images = $product->get_meta( 'external_image', false ) ) {
		foreach ( $external_images as $external_image ) {
			$external_image = json_decode( $external_image->value );
			$image['thumbnail'][] = $external_image->full;
		}
	} else {
		foreach ( $product->get_gallery_image_ids() as $image_id ) {
			$image['thumbnail'][] = wp_get_attachment_url( $image_id );
		}
	}

	if( $featured_image = $product->get_meta( 'featured_image', true ) ) {
		$featured_image = json_decode( $featured_image );
		$image['main']  = $featured_image->full;
	} else {
		$image['main'] = wp_get_attachment_image_url( $product->get_image_id(), 'full' );
	}

	return $image;
}