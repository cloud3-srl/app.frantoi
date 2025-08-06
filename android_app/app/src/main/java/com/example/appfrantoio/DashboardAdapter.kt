package com.example.appfrantoio

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.appfrantoio.databinding.ItemDashboardCardBinding
import com.example.appfrantoio.databinding.ItemDashboardHeaderBinding

private const val VIEW_TYPE_HEADER = 0
private const val VIEW_TYPE_ITEM = 1

class DashboardAdapter(
    private val items: List<DashboardListItem>,
    private val onItemClick: (DashboardListItem.Item) -> Unit
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    override fun getItemViewType(position: Int): Int {
        return when (items[position]) {
            is DashboardListItem.Header -> VIEW_TYPE_HEADER
            is DashboardListItem.Item -> VIEW_TYPE_ITEM
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return when (viewType) {
            VIEW_TYPE_HEADER -> {
                val binding = ItemDashboardHeaderBinding.inflate(LayoutInflater.from(parent.context), parent, false)
                HeaderViewHolder(binding)
            }
            VIEW_TYPE_ITEM -> {
                val binding = ItemDashboardCardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
                ItemViewHolder(binding, onItemClick)
            }
            else -> throw IllegalArgumentException("Invalid view type")
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val item = items[position]) {
            is DashboardListItem.Header -> (holder as HeaderViewHolder).bind(item)
            is DashboardListItem.Item -> (holder as ItemViewHolder).bind(item)
        }
    }

    override fun getItemCount(): Int = items.size

    class HeaderViewHolder(private val binding: ItemDashboardHeaderBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: DashboardListItem.Header) {
            binding.headerTitle.text = item.title
        }
    }

    class ItemViewHolder(
        private val binding: ItemDashboardCardBinding,
        private val onItemClick: (DashboardListItem.Item) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: DashboardListItem.Item) {
            binding.cardTitle.text = item.title
            binding.cardSubtitle.text = item.subtitle
            binding.cardIcon.setImageResource(item.iconRes)
            binding.root.setOnClickListener { onItemClick(item) }
        }
    }
}
