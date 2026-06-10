package com.explorenearme.network

import com.explorenearme.models.PlacesResponse
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Retrofit Interface for connecting to Google Places API (Nearby Search)
 */
interface PlaceService {

    @GET("maps/api/place/nearbysearch/json")
    fun getNearbyPlaces(
        @Query("location") location: String, // format: "latitude,longitude"
        @Query("radius") radius: Int,       // in meters
        @Query("type") type: String?,        // e.g., "restaurant", "cafe"
        @Query("key") apiKey: String
    ): Call<PlacesResponse>

    companion object {
        private const val BASE_URL = "https://maps.googleapis.com/"

        fun create(): PlaceService {
            val retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            return retrofit.create(PlaceService::class.java)
        }
    }
}
