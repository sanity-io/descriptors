import {encodeBase64, RegistryEncoder, SetSketch} from '@sanity/sdefs'
import {JsonInspector, type JsonInspectorProps} from '@rexxars/react-json-inspector'
import '@rexxars/react-json-inspector/json-inspector.css'
import type {SchemaType} from './types'

import schemaTypes from './schema'
import {useCallback, useEffect, useMemo, useState} from 'react'

const registry = new RegistryEncoder()
for (const {name, type, ...typeDef} of schemaTypes as SchemaType[]) {
  registry.addTypeDef(name, {...typeDef, subtypeOf: type})
}

const final = registry.finalize()

function DefCard({
  title,
  data,
  isExpanded,
}: {
  title: string
  data: unknown
  isExpanded?: JsonInspectorProps['isExpanded']
}) {
  return (
    <div className="bg-gray-100 border border-gray-400 px-2 py-2 my-4 max-w-[400px]">
      <div className="font-semibold mb-1">{title}</div>
      <JsonInspector data={data} search={false} isExpanded={isExpanded} />
    </div>
  )
}

type Message = {
  type: 'request' | 'response'
  content: Record<string, unknown>
}

function App() {
  const [stage, setStage] = useState<'initial' | 'request' | 'send-more' | 'done'>('initial')

  const [messages, setMessages] = useState<Message[]>([])

  const totalMessageSize = useMemo(
    () => messages.reduce((sum, msg) => sum + JSON.stringify(msg.content).length, 0),
    [messages],
  )

  useEffect(() => {
    if (messages.length > 1 && messages[0].content.id !== final.registry.id) {
      // The schema changed. Let's reset!
      setMessages([])
      setStage('initial')
    }
  }, [messages, stage, final.registry.id])

  const keys = getStoredDefs()
  const prev: {id: string; sketch: string} | null = localStorage['sdefprev']
    ? JSON.parse(localStorage['sdefprev'])
    : null

  const next = useCallback(() => {
    switch (stage) {
      case 'initial': {
        setMessages([{type: 'request', content: {id: final.registry.id}}])
        setStage('request')
        break
      }
      case 'request': {
        if (keys.includes(final.registry.id)) {
          setMessages([...messages, {type: 'response', content: {type: 'ok'}}])
          setStage('done')
        } else if (prev) {
          setMessages([
            ...messages,
            {type: 'response', content: {type: 'send-more', base: prev.id, sketch: prev.sketch}},
          ])
          setStage('send-more')
        } else {
          setMessages([...messages, {type: 'response', content: {type: 'send-more'}}])
          setStage('send-more')
        }

        break
      }
      case 'send-more': {
        let definitions: null | unknown[] = null
        let base: undefined | string
        let ourSketch: undefined | string

        if (prev && prev.id !== final.registry.id) {
          let sketch = new SetSketch(32, 8)
          decodeBase64(prev.sketch, sketch.arr)
          sketch.toggleAll(registry.sketch)
          const decoded = sketch.decode()
          if (decoded !== null) {
            localStorage[`sdef:${final.registry.id}`] = JSON.stringify(final.registry)
            definitions = []
            base = prev.id
            ourSketch = encodeBase64(registry.sketch.arr)
            decoded.forEach((val) => {
              const id = encodeBase64(val, '\x12\x20')
              if (final.registry.content.includes(id)) {
                definitions!.push(final.namedTypes.find((obj) => obj.id === id))
              }
            })
          }
        }

        if (definitions === null) {
          definitions = [final.registry, ...final.namedTypes]
        }

        for (const def of definitions) {
          localStorage[`sdef:${(def as any).id}`] = JSON.stringify(def)
        }

        localStorage['sdefprev'] = JSON.stringify({
          id: final.registry.id,
          sketch: encodeBase64(registry.sketch.arr),
        })

        setMessages([
          ...messages,
          {
            type: 'request',
            content: {id: final.registry.id, definitions, base, sketch: ourSketch},
          },
        ])
        setStage('done')
      }
    }
  }, [stage])

  const clear = useCallback(() => {
    for (const key of keys) {
      localStorage.removeItem(`sdef:${key}`)
    }
    localStorage.removeItem(`sdefprev`)
    window.location.reload()
  }, [])

  return (
    <div className="flex my-2">
      <div className="p-2 mx-4">
        <h2 className="font-bold text-2xl">Client schema</h2>
        <DefCard title="Registry" data={final.registry} />

        {final.namedTypes.map((namedType) => (
          <DefCard
            key={namedType.name}
            title={`Type: ${namedType.name}`}
            data={namedType}
            isExpanded={(keyPath) => ['typeDef'].includes(keyPath)}
          />
        ))}
      </div>
      <div className="p-2 mx-4 w-[400px]">
        <div className="flex">
          <h2 className="font-bold text-2xl">Communication</h2>
          <div className="flex-1" />
          {stage !== 'done' && (
            <button className="border text-white bg-blue-400 px-4 py-1 rounded-md" onClick={next}>
              Next
            </button>
          )}
        </div>
        <div>
          <span className="font-semibold">{totalMessageSize}</span> bytes transferred
        </div>
        {messages.map((message, idx) => (
          <DefCard
            key={idx}
            title={message.type === 'request' ? 'Client -> Server' : 'Client <- Server'}
            data={message.content}
            isExpanded={() => true}
          />
        ))}
      </div>
      <div className="p-2 mx-4">
        <div className="flex">
          <h2 className="font-bold text-2xl">Server</h2>
          <div className="flex-1" />
          <button className="border text-white bg-blue-400 px-4 py-1 rounded-md" onClick={clear}>
            Clear
          </button>
        </div>
        <div className="max-w-[500px]">
          <p className="mb-4">
            {keys.length} definitions on the server:{' '}
            {keys.map((id) => (
              <span key={id}>
                <MonoSpan text={id} />{' '}
              </span>
            ))}
          </p>
          {prev && <DefCard title="Previously synced registry" data={prev} />}
        </div>
      </div>
    </div>
  )
}

function MonoSpan({text}: {text: string}) {
  return (
    <span className="bg-gray-200 border border-gray-300 font-mono text-xs px-1 mx-1">{text}</span>
  )
}

function getStoredDefs(): string[] {
  const result: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    if (key.startsWith('sdef:')) {
      result.push(key.slice(5))
    }
  }
  result.sort()
  return result
}

function decodeBase64(input: string, into: Uint8Array) {
  const binary = window.atob(input.slice(1).replaceAll('-', '+').replaceAll('_', '/'))
  for (let i = 0; i < binary.length; i++) {
    into[i] = binary.charCodeAt(i)
  }
}

export default App
