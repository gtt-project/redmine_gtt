module RedmineGtt
  module Patches

    # Maybe this is not necessary

    module ApiTemplateHandlerPatch
      def self.prepended(base)
        class << base
          prepend ClassMethods
        end
      end

      module ClassMethods
        def call(template)
          case template
          when 'app/views/issues/index.api.rsb' then
            template = 'plugins/redmine_gtt/app/views/issues/index.api.rsb'
          when 'app/views/issues/show.api.rsb' then
            template = 'plugins/redmine_gtt/app/views/issues/show.api.rsb'
          end
          super(template)
        end
      end

    end
  end
end
