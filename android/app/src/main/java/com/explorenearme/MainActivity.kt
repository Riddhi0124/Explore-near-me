package com.explorenearme

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.explorenearme.databinding.ActivityMainBinding
import com.explorenearme.models.LocalReview
import com.explorenearme.models.PlaceModel
import com.explorenearme.models.PlacesResponse
import com.explorenearme.network.PlaceService
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

/**
 * Category data definition
 */
data class Category(val id: String, val name: String, val emoji: String)

/**
 * Android Main Screen controller handling Google Maps, Permissions,
 * and Retrofit API queries for real-time near-me lookups.
 */
class MainActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var binding: ActivityMainBinding
    private var googleMap: GoogleMap? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val placeService = PlaceService.create()

    private var currentLatLng: LatLng = LatLng(37.4220, -122.0841) // Default to Mountain View (Googleplex)
    private var selectedPlace: PlaceModel? = null
    private val localReviewsMap = mutableMapOf<String, MutableList<LocalReview>>()
    private lateinit var reviewsAdapter: ReviewsAdapter

    private var placesApiKey: String = ""

    companion object {
        private const val LOCATION_REQ_CODE = 1001
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Setup View Binding
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // Try reading the API Key from the manifest dynamically
        try {
            val appInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
            val bundle = appInfo.metaData
            placesApiKey = bundle.getString("com.google.android.geo.API_KEY") ?: ""
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Initialize SupportMapFragment
        val mapFragment = supportFragmentManager.findFragmentById(R.id.mapFragment) as SupportMapFragment
        mapFragment.getMapAsync(this)

        setupListeners()
        setupCategoriesRibbon()
        setupReviewsRecyclerView()
    }

    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        
        // Enable basic UI controls
        map.uiSettings.isZoomControlsEnabled = true
        map.uiSettings.isMyLocationButtonEnabled = true

        checkLocationPermissions()
    }

    private fun checkLocationPermissions() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this, 
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 
                LOCATION_REQ_CODE
            )
        } else {
            enableUserLocation()
        }
    }

    private fun enableUserLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            googleMap?.isMyLocationEnabled = true
            
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                if (location != null) {
                    currentLatLng = LatLng(location.latitude, location.longitude)
                    googleMap?.animateCamera(CameraUpdateFactory.newLatLngZoom(currentLatLng, 15f))
                    
                    // Initial nearby search (Restaurants)
                    fetchNearbyPlaces("restaurant")
                } else {
                    // Fallback search around Googleplex Mountain View if GPS coords are loading
                    fetchNearbyPlaces("restaurant")
                }
            }
        }
    }

    private fun fetchNearbyPlaces(type: String) {
        val locationString = "${currentLatLng.latitude},${currentLatLng.longitude}"
        
        if (placesApiKey.isBlank() || placesApiKey.contains("YOUR_")) {
            Toast.makeText(this, "Please verify your Maps API Key in AndroidManifest.xml before searching!", Toast.LENGTH_LONG).show()
            return
        }

        placeService.getNearbyPlaces(
            location = locationString,
            radius = 1500, // Search within 1.5 KM
            type = type,
            apiKey = placesApiKey
        ).enqueue(object : Callback<PlacesResponse> {
            override fun onResponse(call: Call<PlacesResponse>, response: Response<PlacesResponse>) {
                if (response.isSuccessful) {
                    val placesList = response.body()?.results ?: emptyList()
                    showMapMarkers(placesList)
                    if (placesList.isEmpty()) {
                        Toast.makeText(this@MainActivity, "No nearby results found for this category.", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(this@MainActivity, "Places API Error: " + response.message(), Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<PlacesResponse>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Network Failure: ${t.localizedMessage}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun showMapMarkers(places: List<PlaceModel>) {
        googleMap?.clear()
        
        for (place in places) {
            val position = LatLng(place.geometry.location.lat, place.geometry.location.lng)
            
            val marker = googleMap?.addMarker(
                MarkerOptions()
                    .position(position)
                    .title(place.name)
            )
            marker?.tag = place
        }

        googleMap?.setOnMarkerClickListener { clickedMarker ->
            val place = clickedMarker.tag as? PlaceModel
            if (place != null) {
                presentPlaceDetails(place)
            }
            false
        }
    }

    private fun presentPlaceDetails(place: PlaceModel) {
        selectedPlace = place
        
        binding.landmarkDetailsSheet.visibility = View.VISIBLE
        binding.landmarkTitle.text = place.name
        binding.landmarkAddress.text = place.vicinity ?: "Address not available"
        binding.landmarkRating.text = (place.rating ?: 5.0).toString()

        // Populate local reviews
        refreshReviewsStream(place.placeId)
    }

    private fun setupReviewsRecyclerView() {
        reviewsAdapter = ReviewsAdapter(mutableListOf())
        binding.reviewsRecyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
        binding.reviewsRecyclerView.adapter = reviewsAdapter
    }

    private fun refreshReviewsStream(placeId: String) {
        val customReviews = localReviewsMap[placeId] ?: mutableListOf()
        if (customReviews.isEmpty()) {
            // Seed a default review to demonstrate interactive feedback
            customReviews.add(LocalReview("Explorer Guide", "🧭", 5, "Perfect location near the transit map path! High quality atmosphere."))
            localReviewsMap[placeId] = customReviews
        }
        reviewsAdapter.updateList(customReviews)
    }

    private fun setupListeners() {
        binding.btnDirections.setOnClickListener {
            selectedPlace?.let { place ->
                val gmmIntentUri = Uri.parse("google.navigation:q=${place.geometry.location.lat},${place.geometry.location.lng}")
                val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri)
                mapIntent.setPackage("com.google.android.apps.maps")
                startActivity(mapIntent)
            }
        }

        binding.btnSave.setOnClickListener {
            selectedPlace?.let { place ->
                Toast.makeText(this, "Saved \"${place.name}\" to your passport list!", Toast.LENGTH_SHORT).show()
            }
        }

        binding.postReviewBtn.setOnClickListener {
            val comment = binding.writeReviewInput.text.toString()
            val place = selectedPlace
            if (comment.isNotBlank() && place != null) {
                val review = LocalReview(
                    authorName = "Explorer Buddy",
                    authorAvatar = "🏕️",
                    rating = 5,
                    text = comment
                )
                
                val currentList = localReviewsMap[place.placeId] ?: mutableListOf()
                currentList.add(0, review)
                localReviewsMap[place.placeId] = currentList
                
                binding.writeReviewInput.setText("")
                refreshReviewsStream(place.placeId)
                Toast.makeText(this, "Local Review Published!", Toast.LENGTH_SHORT).show()
            }
        }
        
        binding.profileButton.setOnClickListener {
            Toast.makeText(this, "Passport Profile Panel opened! Track your bookmarks and stats.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupCategoriesRibbon() {
        val categories = listOf(
            Category("restaurant", "Restaurants", "🍔"),
            Category("cafe", "Cafes", "☕"),
            Category("park", "Parks", "🌳"),
            Category("tourist_attraction", "Attractions", "🎡")
        )
        
        binding.categoryLayout.removeAllViews()
        for (cat in categories) {
            val button = com.google.android.material.button.MaterialButton(this, null, com.google.android.material.R.attr.materialButtonStyleOutlined).apply {
                text = "${cat.emoji} ${cat.name}"
                textSize = 12f
                setPadding(24, 0, 24, 0)
                cornerRadius = 40
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(8, 0, 8, 0)
                }
                setOnClickListener {
                    fetchNearbyPlaces(cat.id)
                    Toast.makeText(this@MainActivity, "Searching for nearby ${cat.name}...", Toast.LENGTH_SHORT).show()
                }
            }
            binding.categoryLayout.addView(button)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_REQ_CODE && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            enableUserLocation()
        }
    }

    /**
     * Inline adapter to make reviews list interactive and visual
     */
    inner class ReviewsAdapter(private var reviews: MutableList<LocalReview>) : RecyclerView.Adapter<ReviewsAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val authorTextView: TextView = view.findViewById(R.id.reviewAuthor)
            val ratingTextView: TextView = view.findViewById(R.id.reviewRating)
            val contentTextView: TextView = view.findViewById(R.id.reviewText)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.id.item_review, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = reviews[position]
            holder.authorTextView.text = "${item.authorAvatar} ${item.authorName}"
            holder.ratingTextView.text = "★ ".repeat(item.rating)
            holder.contentTextView.text = item.text
        }

        override fun getItemCount() = reviews.size

        fun updateList(newList: List<LocalReview>) {
            reviews.clear()
            reviews.addAll(newList)
            notifyDataSetChanged()
        }
    }
}
