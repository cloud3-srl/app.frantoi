package com.example.appfrantoio

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.example.appfrantoio.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val dashboardItems = listOf(
            DashboardListItem.Header("Operazioni Quotidiane"),
            DashboardListItem.Item("Prenotazione", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Visualizza Prenotazioni", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Conferimento", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Molitura", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Movimentazione Olio", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Registro Oli Sian", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Documenti di Trasporto", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Fatture", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Header("Funzioni Amministrative"),
            DashboardListItem.Item("Anagrafica", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Gestione Cisterne", "", R.drawable.ic_launcher_foreground),
            DashboardListItem.Item("Documenti e Report", "", R.drawable.ic_launcher_foreground)
        )

        val layoutManager = GridLayoutManager(this, 2)
        layoutManager.spanSizeLookup = object : GridLayoutManager.SpanSizeLookup() {
            override fun getSpanSize(position: Int): Int {
                return when (dashboardItems[position]) {
                    is DashboardListItem.Header -> 2
                    is DashboardListItem.Item -> 1
                }
            }
        }

        binding.dashboardRecycler.layoutManager = layoutManager
        binding.dashboardRecycler.adapter = DashboardAdapter(dashboardItems) { item ->
            Toast.makeText(this, "Clicked: ${item.title}", Toast.LENGTH_SHORT).show()
        }
    }
}

sealed class DashboardListItem {
    data class Header(val title: String) : DashboardListItem()
    data class Item(val title: String, val subtitle: String, val iconRes: Int) : DashboardListItem()
}
