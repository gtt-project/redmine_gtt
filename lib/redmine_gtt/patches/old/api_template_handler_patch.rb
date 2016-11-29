module GttCore
  module Patches
    module ApiTemplateHandlerPatch
      module ClassMethods
        def hello
          puts 'Hello, from plugin'
        end
        def call(template)
          case template
          when 'app/views/issues/index.api.rsb' then
            template = 'plugins/gtt_core/app/views/issues/index.api.rsb'
          when 'app/views/issues/show.api.rsb' then
            template = 'plugins/gtt_core/app/views/issues/show.api.rsb'
          end
          p template
          super(template)
        end
      end
      def self.prepended(base)
        class << base
          prepend ClassMethods
        end
      end
    end
  end
end
