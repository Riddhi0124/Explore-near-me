package com.explorenearme.models

import com.google.gson.annotations.SerializedName

/**
 * Places API Response Models for Retrofit integration
 */
data class PlacesResponse(
    @SerializedName("results") val results: List<PlaceModel>,
    @SerializedName("status") val status: String
)

data class PlaceModel(
    @SerializedName("place_id") val placeId: String,
    @SerializedName("name") val name: String,
    @SerializedName("vicinity") val vicinity: String?,
    @SerializedName("rating") val rating: Double?,
    @SerializedName("user_ratings_total") val userRatingsTotal: Int?,
    @SerializedName("geometry") val geometry: Geometry,
    @SerializedName("photos") val photos: List<Photo>?,
    @SerializedName("opening_hours") val openingHours: OpeningHours?,
    @SerializedName("types") val types: List<String>?
)

data class Geometry(
    @SerializedName("location") val location: LocationModel
)

data class LocationModel(
    @SerializedName("lat") val lat: Double,
    @SerializedName("lng") val lng: Double
)

data class Photo(
    @SerializedName("photo_reference") val photoReference: String,
    @SerializedName("height") val height: Int,
    @SerializedName("width") val width: Int
)

data class OpeningHours(
    @SerializedName("open_now") val openNow: Boolean?
)

/**
 * Local Review Model for custom reviews left on landmarks
 */
data class LocalReview(
    val authorName: String,
    val authorAvatar: String,
    val rating: Int,
    val text: String,
    val relativeTime: String = "Just now"
)
