package com.sliit.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "roles")
public class Role {
    @Id
    private String id;
    private String name; // e.g., ADMIN, USER, TECHNICIAN, or custom
    private String description;
    private List<String> permissions;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }

    public static RoleBuilder builder() {
        return new RoleBuilder();
    }

    public static class RoleBuilder {
        private String id;
        private String name;
        private String description;
        private List<String> permissions;

        public RoleBuilder id(String id) {
            this.id = id;
            return this;
        }

        public RoleBuilder name(String name) {
            this.name = name;
            return this;
        }

        public RoleBuilder description(String description) {
            this.description = description;
            return this;
        }

        public RoleBuilder permissions(List<String> permissions) {
            this.permissions = permissions;
            return this;
        }

        public Role build() {
            Role role = new Role();
            role.setId(id);
            role.setName(name);
            role.setDescription(description);
            role.setPermissions(permissions);
            return role;
        }
    }
}
