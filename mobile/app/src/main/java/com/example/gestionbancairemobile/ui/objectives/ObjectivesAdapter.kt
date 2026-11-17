package com.example.gestionbancairemobile.ui.objectives

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.gestionbancairemobile.data.model.Objective
import com.example.gestionbancairemobile.databinding.ItemObjectiveBinding

class ObjectivesAdapter(
    private val allObjectives: List<Objective>,
    private val selectedIds: MutableSet<Int>
) : RecyclerView.Adapter<ObjectivesAdapter.ObjectiveViewHolder>() {

    inner class ObjectiveViewHolder(
        private val binding: ItemObjectiveBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(objective: Objective) {

            binding.tvObjectiveLabel.text = objective.libelle
            binding.cbObjective.isChecked = selectedIds.contains(objective.id)

            // Basculer la sélection au clic sur la ligne entière
            binding.root.setOnClickListener {

                if (selectedIds.contains(objective.id)) {
                    selectedIds.remove(objective.id)
                } else {
                    selectedIds.add(objective.id)
                }

                binding.cbObjective.isChecked = selectedIds.contains(objective.id)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ObjectiveViewHolder {

        val binding = ItemObjectiveBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )

        return ObjectiveViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ObjectiveViewHolder, position: Int) {
        holder.bind(allObjectives[position])
    }

    override fun getItemCount(): Int = allObjectives.size

    // Retourner les IDs sélectionnés
    fun getSelectedIds(): List<Int> = selectedIds.toList()
}
