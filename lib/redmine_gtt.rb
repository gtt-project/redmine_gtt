# frozen_string_literal: true

module RedmineGtt

  # Number of decimal places GeoJSON coordinates are rounded to on output
  # (EPSG:4326 degrees, so 6 digits is ~0.11 m, 7 ~1 cm). RGeo's encoder emits
  # full float precision and upstream declines to add a precision option, so
  # the plugin rounds itself; the default keeps payloads small without losing
  # any real-world accuracy. Configurable via plugin settings; clamped so a
  # bad value can never break SQL or produce absurd output.
  DEFAULT_GEOJSON_PRECISION = 6
  GEOJSON_PRECISION_RANGE = (0..15)

  def self.geojson_precision
    raw = Setting.plugin_redmine_gtt['geojson_precision']
    value = Integer(raw, exception: false) || DEFAULT_GEOJSON_PRECISION
    value.clamp(GEOJSON_PRECISION_RANGE.min, GEOJSON_PRECISION_RANGE.max)
  end

  def self.setup_normal_patches
    RedmineGtt::Patches::IssuePatch.apply
    RedmineGtt::Patches::IssueQueryPatch.apply
    RedmineGtt::Patches::ProjectPatch.apply
    RedmineGtt::Patches::UserPatch.apply

    RedmineGtt::Patches::ProjectsHelperPatch.apply
    RedmineGtt::Patches::PluginSettingPatch.apply
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

