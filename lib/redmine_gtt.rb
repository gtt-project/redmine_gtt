# frozen_string_literal: true

# Global Hooks
require 'redmine_gtt/hooks/view_layouts_base_html_head_hook'
require 'redmine_gtt/view_hooks'


# API Template Hooks
# Seems like this is not necessary
# require 'redmine_gtt/patches/api_template_handler_patch.rb'

# Configure View Overrides
Rails.application.paths["app/overrides"] ||= []
Rails.application.paths["app/overrides"] << File.expand_path("../../app/overrides", __FILE__)

# Register MIME Types
Mime::Type.register_alias "application/json", :geojson

RGeo::ActiveRecord::SpatialFactoryStore.instance.tap do |config|
  # By default, use the GEOS implementation for spatial columns.
  # config.default = RGeo::Geos.factory_generator

  config.register RGeo::Cartesian.preferred_factory(srid: 4326), geo_type: 'geometry', sql_type: "geometry", srid: 4326

  # But use a geographic implementation for point columns.
  # config.register(RGeo::Geographic.spherical_factory(srid: 4326), geo_type: "point")
end

module RedmineGtt

  def self.setup_normal_patches
    RedmineGtt::Patches::IssuesHelperPatch.apply

    RedmineGtt::Patches::IssuePatch.apply
    RedmineGtt::Patches::IssueQueryPatch.apply
    RedmineGtt::Patches::ProjectPatch.apply
    RedmineGtt::Patches::UserPatch.apply

    RedmineGtt::Patches::ProjectsHelperPatch.apply

    # unless IssueQuery.included_modules.include?(RedmineGtt::Patches::IssueQueryPatch)
    # 	IssueQuery.send(:include, RedmineGtt::Patches::IssueQueryPatch)
    # end


    #Redmine::Views::ApiTemplateHandler.send(:prepend, RedmineGtt::Patches::ApiTemplateHandlerPatch)
  end

  def self.setup_controller_patches

    RedmineGtt::Patches::IssuesControllerPatch.apply
    RedmineGtt::Patches::ProjectsControllerPatch.apply
    RedmineGtt::Patches::UsersControllerPatch.apply

    [
      IssuesController,
      MyController,
      ProjectsController,
      UsersController,
    ].each{ |c| c.send :helper, 'gtt_map' }
  end
end

