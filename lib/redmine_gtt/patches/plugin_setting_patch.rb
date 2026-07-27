# frozen_string_literal: true

module RedmineGtt
  module Patches
    # Sanitizes tracker icon SVGs whenever the plugin settings are written
    # (the core SettingsController mass-assigns the settings hash, so the
    # setter is the single reliable write path).
    module PluginSettingPatch
      def self.apply
        Setting.singleton_class.prepend(self) unless Setting.singleton_class < self
      end

      def plugin_redmine_gtt=(settings)
        if settings.respond_to?(:each_pair)
          settings = settings.to_unsafe_h if settings.respond_to?(:to_unsafe_h)
          settings = settings.each_with_object({}) do |(key, value), result|
            result[key] =
              if key.to_s.start_with?('tracker_')
                RedmineGtt::TrackerIcon.normalize(value)
              else
                value
              end
          end
        end
        super
      end
    end
  end
end
