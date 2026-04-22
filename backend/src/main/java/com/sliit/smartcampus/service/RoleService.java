package com.sliit.smartcampus.service;

import com.sliit.smartcampus.model.Role;
import com.sliit.smartcampus.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public List<Role> listAll() {
        return roleRepository.findAll();
    }

  public Optional<Role> findById(String id) {
        return roleRepository.findById(Long.parseLong(id));
    }
    }

    public Role create(Role role) {
        return roleRepository.save(role);
    }

    public Optional<Role> update(String id, Role update) {
        return roleRepository.findById(Long.parseLong(id)).map(existing -> {
            existing.setName(update.getName());
            existing.setDescription(update.getDescription());
            existing.setPermissions(update.getPermissions());
            return roleRepository.save(existing);
        });
    }

    public void delete(String id) {
        roleRepository.deleteById(Long.parseLong(id));
    }
}
