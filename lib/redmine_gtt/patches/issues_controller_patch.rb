module RedmineGtt
  module Patches

    module IssuesControllerPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          alias_method_chain :show, :geojson
          alias_method_chain :index, :geojson
        end
      end

      module ClassMethods
      end

      module InstanceMethods
        def show_with_geojson
          respond_to do |format|
            format.geojson { send_data(
              @issue.geojson.to_json,
              :type => 'application/json; header=present',
              :filename => "#{@issue.id}.geojson")
            }
            format.any { show_without_geojson }
          end
        end

        def index_with_geojson
          # It's not so great to have to copy the whole "index" method to add
          # another output format (geojson). Hopefully this isn't too annoying
          # to maintain. See the previous alias how it would be much nicer.
          retrieve_query

          if @query.valid?
            respond_to do |format|
              format.geojson { send_data(
                IssuesHelper.get_geojson(@issues).to_json,
                :type => 'application/json; header=present',
                :filename => "issues.geojson")
              }
              format.any { index_without_geojson }
            end
          else
            respond_to do |format|
              format.any { index_without_geojson }
            end
          end
        end
      end

    end
  end
end

unless IssuesController.included_modules.include?(RedmineGtt::Patches::IssuesControllerPatch)
  IssuesController.send(:include, RedmineGtt::Patches::IssuesControllerPatch)
end
